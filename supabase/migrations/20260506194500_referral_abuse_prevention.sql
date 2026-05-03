-- 추천 악용 완화: 보상 확정 시점(available_at), 첫 저장 referralCode 패턴 호환(profiles 플래그),
-- 가입 시그널·referral 유입 방문자 고유 처리, 카드 이벤트(view) 방문당 1건

-- ---------------------------------------------------------------------------
-- 1) 프로필: 부정 검수 플래그
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS fraud_flag boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fraud_notes text NULL;

COMMENT ON COLUMN public.profiles.fraud_flag IS 'true면 출금 제한 등 자동 차단 후 관리자 검수';
COMMENT ON COLUMN public.profiles.fraud_notes IS '자동 또는 관리자 메모';

-- ---------------------------------------------------------------------------
-- 2) signup_signals — 동일 디바이스 다계정 탐지(휴리스틱)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.signup_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  device_id text NOT NULL,
  user_agent text NULL,
  ip_address text NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now (),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS signup_signals_device_created_idx ON public.signup_signals (device_id, created_at DESC);

ALTER TABLE public.signup_signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS signup_signals_own_select ON public.signup_signals;
CREATE POLICY signup_signals_own_select ON public.signup_signals FOR SELECT TO authenticated USING (user_id = auth.uid ());

DROP POLICY IF EXISTS signup_signals_admin_select ON public.signup_signals;
CREATE POLICY signup_signals_admin_select ON public.signup_signals FOR SELECT TO authenticated USING (public.is_app_admin ());

COMMENT ON TABLE public.signup_signals IS '가입 디바이스·UA·선택적 IP 로그 — 부정 가입 패턴 검출용';

-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_signup_signal (
  p_device_id text,
  p_user_agent text DEFAULT NULL,
  p_ip_address text DEFAULT NULL,
  p_meta jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid ();
  dev text;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  dev := NULLIF(trim(p_device_id), '');
  IF dev IS NULL OR length(dev) < 8 THEN
    RETURN;
  END IF;

  INSERT INTO public.signup_signals (user_id, device_id, user_agent, ip_address, meta)
  VALUES (
    uid,
    dev,
    NULLIF(trim(p_user_agent), ''),
    NULLIF(trim(p_ip_address), ''),
    coalesce(p_meta, '{}'::jsonb)
  )
  ON CONFLICT (user_id) DO UPDATE SET
    device_id = excluded.device_id,
    user_agent = coalesce(excluded.user_agent, signup_signals.user_agent),
    ip_address = coalesce(excluded.ip_address, signup_signals.ip_address),
    meta = signup_signals.meta || excluded.meta;

  -- 짧은 시간 내 동일 device_id 에서 다른 user 여러 명이 가입했으면 최근 계정 플래그
  PERFORM 1 FROM public.signup_signals d
   WHERE d.device_id = dev
     AND d.created_at > now() - interval '48 hours'
     AND d.user_id <> uid
   LIMIT 1;

  IF FOUND THEN
    UPDATE public.profiles
    SET
      fraud_flag = true,
      fraud_notes = trim(
        BOTH ' | '
        FROM coalesce(fraud_notes, '') || CASE
          WHEN coalesce(fraud_notes, '') LIKE '%auto_multi_device%' THEN ''
          ELSE ' | auto_multi_device_same_device_window'
        END
      ),
      updated_at = now()
    WHERE id = uid
      AND coalesce(fraud_flag, false) = false;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_signup_signal (text, text, text, jsonb) TO authenticated;

-- signup_signals 에는 INSERT 정책 없음(RPC SECURITY DEFINER만 기록 가능)

-- ---------------------------------------------------------------------------
-- 3) referral_rewards: 확정 가능 시점(결제 후 7일까지 pending)
-- ---------------------------------------------------------------------------
ALTER TABLE public.referral_rewards
  ADD COLUMN IF NOT EXISTS available_at timestamptz NULL;

COMMENT ON COLUMN public.referral_rewards.available_at IS '이 시점 이후 finalize 시 confirmed(출금 후보로 이동)';

CREATE OR REPLACE FUNCTION public.referral_rewards_touch_available_at ()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.available_at IS NULL THEN
    NEW.available_at := NEW.created_at + interval '7 days';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_referral_rewards_available_at ON public.referral_rewards;
CREATE TRIGGER tr_referral_rewards_available_at
BEFORE INSERT ON public.referral_rewards FOR EACH ROW
EXECUTE PROCEDURE public.referral_rewards_touch_available_at ();

UPDATE public.referral_rewards
SET
  available_at = created_at + interval '7 days'
WHERE
  available_at IS NULL;

CREATE OR REPLACE FUNCTION public.finalize_eligible_referrer_rewards ()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid ();
  n integer := 0;
BEGIN
  IF uid IS NULL THEN
    RETURN 0;
  END IF;

  UPDATE public.referral_rewards
  SET
    status = 'confirmed',
    confirmed_at = COALESCE(confirmed_at, now())
  WHERE
    referrer_user_id = uid
    AND status = 'pending'
    AND available_at <= now ();

  GET DIAGNOSTICS n = ROW_COUNT;

  RETURN n;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4) referral_link_visits: 방문자 UUID 기준 같은 코드는 1행만 허용(클라이언트 제공 시)
-- ---------------------------------------------------------------------------
ALTER TABLE public.referral_link_visits
  ADD COLUMN IF NOT EXISTS visitor_client_id uuid NULL;

CREATE UNIQUE INDEX IF NOT EXISTS referral_link_visits_code_visitor_uidx ON public.referral_link_visits (
  referral_code,
  visitor_client_id
)
WHERE
  visitor_client_id IS NOT NULL;

DROP FUNCTION IF EXISTS public.record_referral_link_visit (text, text, text);

CREATE OR REPLACE FUNCTION public.record_referral_link_visit (
  p_code text,
  p_landing_path text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_visitor_client_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized text;
  exists_profile boolean;
BEGIN
  IF p_code IS NULL OR length(trim(p_code)) < 4 THEN
    RETURN;
  END IF;

  normalized := upper(trim(p_code));

  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE referral_code = normalized
    LIMIT 1
  )
  INTO exists_profile;

  IF NOT exists_profile THEN
    RETURN;
  END IF;

  IF p_visitor_client_id IS NOT NULL THEN
    BEGIN
      INSERT INTO public.referral_link_visits (
        referral_code,
        landing_path,
        user_agent,
        visitor_client_id
      )
      VALUES (
        normalized,
        NULLIF(trim(COALESCE(p_landing_path, '')), ''),
        NULLIF(trim(COALESCE(p_user_agent, '')), ''),
        p_visitor_client_id
      );
    EXCEPTION
      WHEN unique_violation THEN
        RETURN;
    END;

    RETURN;
  END IF;

  INSERT INTO public.referral_link_visits (
    referral_code,
    landing_path,
    user_agent,
    visitor_client_id
  )
  VALUES (
    normalized,
    NULLIF(trim(COALESCE(p_landing_path, '')), ''),
    NULLIF(trim(COALESCE(p_user_agent, '')), ''),
    NULL
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_referral_link_visit (text, text, text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.record_referral_link_visit (text, text, text, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 5) card_events: 동일 카드·동일 방문자·view 이벤트 1건만
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS card_events_view_card_visitor_uidx ON public.card_events (
  card_id,
  visitor_id
)
WHERE
  event_type = 'view'
  AND visitor_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 6) 출금: fraud 플래그 시 차단(referral)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_withdrawal_request (
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
  uid uuid := auth.uid ();
  total integer := 0;
  rid uuid;
  r record;
  cnt integer;
  blocked boolean := false;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = uid
        AND coalesce(p.fraud_flag, false) = true
    )
    INTO blocked;

  IF blocked THEN
    RAISE EXCEPTION 'withdrawal_blocked_pending_review';
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

  SELECT COUNT(*)::integer INTO cnt FROM public.referral_rewards WHERE id = ANY (p_reward_ids);

  IF cnt <> array_length(p_reward_ids, 1) THEN
    RAISE EXCEPTION 'unknown reward id';
  END IF;

  FOR r IN
  SELECT id, reward_amount, referrer_user_id, status, withdrawal_request_id FROM public.referral_rewards
  WHERE
    id = ANY (p_reward_ids) FOR UPDATE
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
  VALUES (
    uid,
    total,
    trim(p_bank_name),
    trim(p_bank_account),
    trim(p_account_holder),
    'pending'
  )
  RETURNING
    id INTO rid;

  UPDATE public.referral_rewards SET withdrawal_request_id = rid WHERE id = ANY (p_reward_ids);

  RETURN rid;
END;
$$;

-- ---------------------------------------------------------------------------
-- 7) 파트너 출금: fraud 플래그 시 차단
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_partner_commission_withdrawal_request (
  p_commission_ids uuid[],
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
  uid uuid := auth.uid ();
  total integer := 0;
  rid uuid;
  r record;
  cnt integer;
  blocked boolean := false;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = uid
        AND coalesce(p.fraud_flag, false) = true
    )
    INTO blocked;

  IF blocked THEN
    RAISE EXCEPTION 'withdrawal_blocked_pending_review';
  END IF;

  IF p_commission_ids IS NULL OR array_length(p_commission_ids, 1) IS NULL OR array_length(p_commission_ids, 1) < 1 THEN
    RAISE EXCEPTION 'commission ids required';
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

  SELECT count(*)::integer INTO cnt FROM public.partner_commissions WHERE id = ANY (p_commission_ids);
  IF cnt <> array_length(p_commission_ids, 1) THEN
    RAISE EXCEPTION 'unknown commission id';
  END IF;

  FOR r IN
    SELECT id, partner_user_id, partner_amount, settlement_status, withdrawal_request_id
    FROM public.partner_commissions
    WHERE id = ANY (p_commission_ids)
    FOR UPDATE
  LOOP
    IF r.partner_user_id <> uid THEN
      RAISE EXCEPTION 'invalid commission';
    END IF;
    IF r.settlement_status <> 'confirmed' THEN
      RAISE EXCEPTION 'commission not confirmed: %', r.id;
    END IF;
    IF r.withdrawal_request_id IS NOT NULL THEN
      RAISE EXCEPTION 'commission already locked';
    END IF;
    total := total + r.partner_amount;
  END LOOP;

  IF total < 10000 THEN
    RAISE EXCEPTION 'minimum withdrawal is 10000';
  END IF;

  INSERT INTO public.withdrawal_requests (
    user_id, amount, bank_name, bank_account, account_holder, status, source_kind
  )
  VALUES (
    uid, total, trim(p_bank_name), trim(p_bank_account), trim(p_account_holder), 'pending', 'partner'
  )
  RETURNING id INTO rid;

  UPDATE public.partner_commissions
  SET withdrawal_request_id = rid
  WHERE id = ANY (p_commission_ids);

  RETURN rid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_partner_commission_withdrawal_request (uuid[], text, text, text) TO authenticated;
