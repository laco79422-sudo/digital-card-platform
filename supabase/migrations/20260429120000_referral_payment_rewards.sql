-- 결제(payments), 추천 보상(referral_rewards), 출금(withdrawal_requests), 환불 clawback
-- 선행: referrals, profiles (20260429100000_referrals_profiles.sql)

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  plan_type text NOT NULL,
  amount integer NOT NULL CHECK (amount >= 0),
  status text NOT NULL DEFAULT 'paid',
  payment_provider text NULL,
  provider_payment_id text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  refunded_at timestamptz NULL,
  CONSTRAINT payments_status_check CHECK (status IN ('paid', 'refunded', 'failed'))
);

CREATE UNIQUE INDEX IF NOT EXISTS payments_provider_unique
  ON public.payments (payment_provider, provider_payment_id)
  WHERE payment_provider IS NOT NULL AND provider_payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS payments_user_id_idx ON public.payments (user_id);

CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  amount integer NOT NULL CHECK (amount >= 0),
  bank_name text NOT NULL,
  bank_account text NOT NULL,
  account_holder text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz NULL,
  CONSTRAINT withdrawal_requests_status_check CHECK (
    status IN ('pending', 'approved', 'paid', 'rejected')
  )
);

CREATE INDEX IF NOT EXISTS withdrawal_requests_user_idx ON public.withdrawal_requests (user_id);

CREATE TABLE IF NOT EXISTS public.referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  payment_id uuid NOT NULL REFERENCES public.payments (id) ON DELETE CASCADE,
  payment_amount integer NOT NULL CHECK (payment_amount >= 0),
  reward_rate numeric NOT NULL DEFAULT 0.10,
  reward_amount integer NOT NULL CHECK (reward_amount >= 0),
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz NULL,
  cancelled_at timestamptz NULL,
  withdrawal_request_id uuid NULL REFERENCES public.withdrawal_requests (id) ON DELETE SET NULL,
  CONSTRAINT referral_rewards_status_check CHECK (
    status IN ('pending', 'confirmed', 'paid', 'cancelled')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS referral_rewards_payment_id_key ON public.referral_rewards (payment_id);

CREATE INDEX IF NOT EXISTS referral_rewards_referrer_idx ON public.referral_rewards (referrer_user_id);
CREATE INDEX IF NOT EXISTS referral_rewards_withdrawal_idx ON public.referral_rewards (withdrawal_request_id);

CREATE TABLE IF NOT EXISTS public.referral_clawbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  referral_reward_id uuid NOT NULL REFERENCES public.referral_rewards (id) ON DELETE CASCADE,
  payment_id uuid NOT NULL REFERENCES public.payments (id) ON DELETE CASCADE,
  amount integer NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  settled_at timestamptz NULL,
  note text NULL,
  CONSTRAINT referral_clawbacks_status_check CHECK (status IN ('pending', 'settled', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS referral_clawbacks_referrer_idx ON public.referral_clawbacks (referrer_user_id);

-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_app_admin() TO authenticated;

-- ---------------------------------------------------------------------------
-- RPC: 결제 성공 + 추천 보상 (floor(amount * 0.1))
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_payment_and_referral_reward(
  p_plan_type text,
  p_amount integer,
  p_payment_provider text DEFAULT NULL,
  p_provider_payment_id text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  pid uuid;
  ref_row public.referrals%ROWTYPE;
  rw integer;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'invalid amount';
  END IF;

  IF p_plan_type IS NULL OR length(trim(p_plan_type)) < 1 THEN
    RAISE EXCEPTION 'invalid plan_type';
  END IF;

  IF p_payment_provider IS NOT NULL AND p_provider_payment_id IS NOT NULL THEN
    SELECT id INTO pid FROM public.payments
    WHERE payment_provider = p_payment_provider AND provider_payment_id = p_provider_payment_id;
    IF FOUND THEN
      RETURN pid;
    END IF;
  END IF;

  INSERT INTO public.payments (user_id, plan_type, amount, status, payment_provider, provider_payment_id)
  VALUES (uid, trim(p_plan_type), p_amount, 'paid', p_payment_provider, p_provider_payment_id)
  RETURNING id INTO pid;

  SELECT * INTO ref_row FROM public.referrals WHERE referred_user_id = uid LIMIT 1;

  IF ref_row.referrer_user_id IS NOT NULL AND ref_row.referrer_user_id <> uid THEN
    rw := floor(p_amount * 0.1)::integer;
    IF rw > 0 THEN
      INSERT INTO public.referral_rewards (
        referrer_user_id, referred_user_id, payment_id,
        payment_amount, reward_rate, reward_amount, status
      )
      VALUES (
        ref_row.referrer_user_id, uid, pid,
        p_amount, 0.10, rw, 'pending'
      );
    END IF;
  END IF;

  RETURN pid;
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_payment_with_referral(p_payment_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pay public.payments%ROWTYPE;
  rr public.referral_rewards%ROWTYPE;
  uid uuid := auth.uid();
BEGIN
  SELECT * INTO pay FROM public.payments WHERE id = p_payment_id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF uid IS NULL THEN
    IF NOT public.is_app_admin() THEN
      RAISE EXCEPTION 'forbidden';
    END IF;
  ELSIF pay.user_id <> uid THEN
    IF NOT public.is_app_admin() THEN
      RAISE EXCEPTION 'forbidden';
    END IF;
  END IF;

  IF pay.status = 'refunded' THEN
    RETURN true;
  END IF;

  UPDATE public.payments SET status = 'refunded', refunded_at = now() WHERE id = p_payment_id;

  SELECT * INTO rr FROM public.referral_rewards WHERE payment_id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN true;
  END IF;

  IF rr.status IN ('pending', 'confirmed') THEN
    UPDATE public.referral_rewards
    SET status = 'cancelled', cancelled_at = now()
    WHERE id = rr.id;
  ELSIF rr.status = 'paid' THEN
    UPDATE public.referral_rewards SET status = 'cancelled', cancelled_at = now() WHERE id = rr.id;
    INSERT INTO public.referral_clawbacks (referrer_user_id, referral_reward_id, payment_id, amount, note)
    VALUES (rr.referrer_user_id, rr.id, p_payment_id, rr.reward_amount, '환불로 인한 보상 회수');
  END IF;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_confirm_referral_reward(p_reward_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_app_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.referral_rewards
  SET status = 'confirmed', confirmed_at = coalesce(confirmed_at, now())
  WHERE id = p_reward_id AND status = 'pending';

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_withdrawal_request(
  p_reward_ids uuid[],
  p_bank_name text,
  p_bank_account text,
  p_account_holder text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  total integer := 0;
  rid uuid;
  r record;
  cnt integer;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF p_reward_ids IS NULL OR array_length(p_reward_ids, 1) IS NULL OR array_length(p_reward_ids, 1) < 1 THEN
    RAISE EXCEPTION 'reward ids required';
  END IF;

  IF p_bank_name IS NULL OR length(trim(p_bank_name)) < 1 THEN
    RAISE EXCEPTION 'bank_name required';
  END IF;
  IF p_bank_account IS NULL OR length(trim(p_bank_account)) < 1 THEN
    RAISE EXCEPTION 'bank_account required';
  END IF;
  IF p_account_holder IS NULL OR length(trim(p_account_holder)) < 1 THEN
    RAISE EXCEPTION 'account_holder required';
  END IF;

  SELECT count(*)::integer INTO cnt FROM public.referral_rewards WHERE id = ANY(p_reward_ids);
  IF cnt <> array_length(p_reward_ids, 1) THEN
    RAISE EXCEPTION 'unknown reward id';
  END IF;

  FOR r IN
    SELECT id, reward_amount, referrer_user_id, status, withdrawal_request_id
    FROM public.referral_rewards
    WHERE id = ANY(p_reward_ids)
    FOR UPDATE
  LOOP
    IF r.referrer_user_id <> uid THEN
      RAISE EXCEPTION 'invalid reward';
    END IF;
    IF r.status <> 'confirmed' THEN
      RAISE EXCEPTION 'reward not confirmed: %', r.id;
    END IF;
    IF r.withdrawal_request_id IS NOT NULL THEN
      RAISE EXCEPTION 'reward already locked';
    END IF;
    total := total + r.reward_amount;
  END LOOP;

  IF total < 10000 THEN
    RAISE EXCEPTION 'minimum withdrawal is 10000';
  END IF;

  INSERT INTO public.withdrawal_requests (user_id, amount, bank_name, bank_account, account_holder, status)
  VALUES (uid, total, trim(p_bank_name), trim(p_bank_account), trim(p_account_holder), 'pending')
  RETURNING id INTO rid;

  UPDATE public.referral_rewards
  SET withdrawal_request_id = rid
  WHERE id = ANY(p_reward_ids);

  RETURN rid;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_withdrawal_request_status(
  p_request_id uuid,
  p_new_status text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_app_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF p_new_status NOT IN ('pending', 'approved', 'paid', 'rejected') THEN
    RAISE EXCEPTION 'invalid status';
  END IF;

  UPDATE public.withdrawal_requests
  SET status = p_new_status,
      processed_at = CASE WHEN p_new_status IN ('paid', 'rejected') THEN now() ELSE processed_at END
  WHERE id = p_request_id;

  IF p_new_status = 'paid' THEN
    UPDATE public.referral_rewards
    SET status = 'paid'
    WHERE withdrawal_request_id = p_request_id AND status = 'confirmed';
  ELSIF p_new_status = 'rejected' THEN
    UPDATE public.referral_rewards
    SET withdrawal_request_id = NULL
    WHERE withdrawal_request_id = p_request_id;
  END IF;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_payment_and_referral_reward(text, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_payment_with_referral(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_withdrawal_request(uuid[], text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_confirm_referral_reward(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_withdrawal_request_status(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_confirm_all_pending_rewards()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer;
BEGIN
  IF NOT public.is_app_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.referral_rewards
  SET status = 'confirmed', confirmed_at = coalesce(confirmed_at, now())
  WHERE status = 'pending';
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_confirm_all_pending_rewards() TO authenticated;


-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_clawbacks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payments_select_own ON public.payments;
CREATE POLICY payments_select_own ON public.payments FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS referral_rewards_select_referrer ON public.referral_rewards;
CREATE POLICY referral_rewards_select_referrer ON public.referral_rewards FOR SELECT TO authenticated
  USING (referrer_user_id = auth.uid());

DROP POLICY IF EXISTS withdrawal_requests_select_own ON public.withdrawal_requests;
CREATE POLICY withdrawal_requests_select_own ON public.withdrawal_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS referral_clawbacks_select_own ON public.referral_clawbacks;
CREATE POLICY referral_clawbacks_select_own ON public.referral_clawbacks FOR SELECT TO authenticated
  USING (referrer_user_id = auth.uid());

DROP POLICY IF EXISTS withdrawal_requests_admin_all ON public.withdrawal_requests;
CREATE POLICY withdrawal_requests_admin_all ON public.withdrawal_requests FOR ALL TO authenticated
  USING (public.is_app_admin()) WITH CHECK (public.is_app_admin());

DROP POLICY IF EXISTS referral_rewards_admin_select ON public.referral_rewards;
CREATE POLICY referral_rewards_admin_select ON public.referral_rewards FOR SELECT TO authenticated
  USING (public.is_app_admin());

DROP POLICY IF EXISTS referral_clawbacks_admin_select ON public.referral_clawbacks;
CREATE POLICY referral_clawbacks_admin_select ON public.referral_clawbacks FOR SELECT TO authenticated
  USING (public.is_app_admin());

DROP POLICY IF EXISTS payments_admin_select ON public.payments;
CREATE POLICY payments_admin_select ON public.payments FOR SELECT TO authenticated
  USING (public.is_app_admin());
