-- 운영: payments 확장, 예약 필드, 카카오 상담 URL, 파트너 정산·토스 검증 RPC

-- ---------------------------------------------------------------------------
-- 1) payments: order_id, paid_at, status 에 pending
-- ---------------------------------------------------------------------------
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS order_id text;

CREATE UNIQUE INDEX IF NOT EXISTS payments_order_id_uidx ON public.payments (order_id)
  WHERE order_id IS NOT NULL;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_status_check CHECK (
  status IN ('pending', 'paid', 'refunded', 'failed')
);

UPDATE public.payments SET paid_at = COALESCE(paid_at, created_at) WHERE status = 'paid' AND paid_at IS NULL;

-- ---------------------------------------------------------------------------
-- 2) reservations: 요청 메시지, 결제 상태, 이용 완료
-- ---------------------------------------------------------------------------
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS request_message text;

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid';

ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_status_check;
ALTER TABLE public.reservations ADD CONSTRAINT reservations_status_check CHECK (
  status IN ('pending', 'confirmed', 'cancelled', 'completed')
);

UPDATE public.reservations
SET payment_status = CASE WHEN payment_id IS NOT NULL THEN 'paid' ELSE 'unpaid' END;

-- ---------------------------------------------------------------------------
-- 3) business_cards: 카카오톡 상담 전용 링크
-- ---------------------------------------------------------------------------
ALTER TABLE public.business_cards
  ADD COLUMN IF NOT EXISTS kakao_chat_url text;

-- ---------------------------------------------------------------------------
-- 4) withdrawal_requests: 출금 출처 구분
-- ---------------------------------------------------------------------------
ALTER TABLE public.withdrawal_requests
  ADD COLUMN IF NOT EXISTS source_kind text NOT NULL DEFAULT 'referral';

ALTER TABLE public.withdrawal_requests DROP CONSTRAINT IF EXISTS withdrawal_requests_source_kind_check;
ALTER TABLE public.withdrawal_requests ADD CONSTRAINT withdrawal_requests_source_kind_check CHECK (
  source_kind IN ('referral', 'partner')
);

-- ---------------------------------------------------------------------------
-- 5) partner_commissions: 정산 단계·출금 묶음
-- ---------------------------------------------------------------------------
ALTER TABLE public.partner_commissions
  ADD COLUMN IF NOT EXISTS settlement_status text NOT NULL DEFAULT 'pending';

ALTER TABLE public.partner_commissions
  ADD COLUMN IF NOT EXISTS withdrawal_request_id uuid REFERENCES public.withdrawal_requests (id) ON DELETE SET NULL;

ALTER TABLE public.partner_commissions DROP CONSTRAINT IF EXISTS partner_commissions_settlement_status_check;
ALTER TABLE public.partner_commissions ADD CONSTRAINT partner_commissions_settlement_status_check CHECK (
  settlement_status IN ('pending', 'confirmed', 'paid', 'cancelled')
);

CREATE INDEX IF NOT EXISTS idx_partner_commissions_partner_settlement
  ON public.partner_commissions (partner_user_id, settlement_status);

-- 기존 데이터는 이미 지급 가능으로 간주
UPDATE public.partner_commissions SET settlement_status = 'confirmed' WHERE settlement_status = 'pending';

-- ---------------------------------------------------------------------------
-- 6) 결제 후 14일 경과 시 파트너 보상 확정 (추천 보상과 동일 패턴)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.finalize_eligible_partner_commissions ()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  n integer := 0;
BEGIN
  IF uid IS NULL THEN
    RETURN 0;
  END IF;

  UPDATE public.partner_commissions
  SET settlement_status = 'confirmed'
  WHERE partner_user_id = uid
    AND settlement_status = 'pending'
    AND created_at <= now() - interval '14 days';

  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

GRANT EXECUTE ON FUNCTION public.finalize_eligible_partner_commissions () TO authenticated;

-- ---------------------------------------------------------------------------
-- 7) 예약 데모 결제 — 파트너 커미션은 pending(14일 후 확정 가능)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.confirm_reservation_demo_payment (p_reservation_id uuid, p_token uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.reservations%ROWTYPE;
  owner_uid uuid;
  pay_id uuid;
  prov text;
  gross integer;
  partner_uid uuid;
  partner_ok boolean;
  partner_amt integer;
  creator_net integer;
BEGIN
  SELECT * INTO r FROM public.reservations WHERE id = p_reservation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF r.booking_token IS DISTINCT FROM p_token THEN RAISE EXCEPTION 'TOKEN'; END IF;
  IF r.status <> 'pending' THEN RAISE EXCEPTION 'INVALID_STATE'; END IF;
  IF r.created_at < now() - interval '48 hours' THEN RAISE EXCEPTION 'EXPIRED'; END IF;

  SELECT COALESCE(bc.user_id, bc.owner_id) INTO owner_uid
  FROM public.business_cards bc
  WHERE bc.id = r.card_id AND bc.is_public = true;
  IF owner_uid IS NULL THEN RAISE EXCEPTION 'CARD';

  gross := r.amount_krw;
  partner_uid := r.partner_user_id;
  partner_ok := false;

  IF partner_uid IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.profiles pf
      WHERE pf.id = partner_uid AND pf.is_partner = true AND pf.id <> owner_uid
    )
    INTO partner_ok;
  END IF;

  IF partner_ok THEN
    partner_amt := GREATEST(0, floor(gross * 0.10)::integer);
    creator_net := GREATEST(0, gross - partner_amt);
  ELSE
    partner_amt := 0;
    creator_net := gross;
    partner_uid := NULL;
  END IF;

  prov := 'reservation-' || replace(p_reservation_id::text, '-', '');

  SELECT p.id INTO pay_id FROM public.payments p
  WHERE p.payment_provider = 'demo' AND p.provider_payment_id = prov;

  IF pay_id IS NULL THEN
    INSERT INTO public.payments (
      user_id, plan_type, amount, status, payment_provider, provider_payment_id, paid_at
    )
    VALUES (
      owner_uid, 'reservation_booking', creator_net, 'paid', 'demo', prov, now ()
    )
    RETURNING id INTO pay_id;
  END IF;

  UPDATE public.reservations
  SET
    status = 'confirmed',
    payment_id = pay_id,
    payment_status = 'paid'
  WHERE id = p_reservation_id;

  IF partner_ok AND partner_amt > 0 THEN
    INSERT INTO public.partner_commissions (
      payment_id, reservation_id, partner_user_id, card_id,
      gross_amount, partner_rate, partner_amount, creator_net_amount,
      settlement_status
    )
    VALUES (
      pay_id, r.id, partner_uid, r.card_id,
      gross, 0.10, partner_amt, creator_net,
      'pending'
    );
  END IF;

  RETURN pay_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- 8) Toss 검증 후 예약 확정 — Netlify(service_role) 전용
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.service_finalize_reservation_toss_payment (
  p_reservation_id uuid,
  p_booking_token uuid,
  p_amount integer,
  p_order_id text,
  p_payment_key text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.reservations%ROWTYPE;
  owner_uid uuid;
  pay_id uuid;
  gross integer;
  partner_uid uuid;
  partner_ok boolean;
  partner_amt integer;
  creator_net integer;
BEGIN
  IF (SELECT auth.role ()) IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF p_amount IS NULL OR p_amount < 0 THEN RAISE EXCEPTION 'INVALID_AMOUNT'; END IF;
  IF p_order_id IS NULL OR length(trim(p_order_id)) < 4 THEN RAISE EXCEPTION 'INVALID_ORDER'; END IF;
  IF p_payment_key IS NULL OR length(trim(p_payment_key)) < 4 THEN RAISE EXCEPTION 'INVALID_KEY'; END IF;

  SELECT * INTO r FROM public.reservations WHERE id = p_reservation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND'; END IF;
  IF r.booking_token IS DISTINCT FROM p_booking_token THEN RAISE EXCEPTION 'TOKEN'; END IF;
  IF r.status <> 'pending' THEN RAISE EXCEPTION 'INVALID_STATE'; END IF;
  IF r.amount_krw IS DISTINCT FROM p_amount THEN RAISE EXCEPTION 'AMOUNT_MISMATCH'; END IF;
  IF r.created_at < now() - interval '48 hours' THEN RAISE EXCEPTION 'EXPIRED'; END IF;

  SELECT COALESCE(bc.user_id, bc.owner_id) INTO owner_uid
  FROM public.business_cards bc
  WHERE bc.id = r.card_id AND bc.is_public = true;
  IF owner_uid IS NULL THEN RAISE EXCEPTION 'CARD';

  SELECT p.id INTO pay_id FROM public.payments p
  WHERE p.payment_provider = 'toss' AND p.provider_payment_id = trim(p_payment_key);

  gross := r.amount_krw;
  partner_uid := r.partner_user_id;
  partner_ok := false;

  IF partner_uid IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.profiles pf
      WHERE pf.id = partner_uid AND pf.is_partner = true AND pf.id <> owner_uid
    )
    INTO partner_ok;
  END IF;

  IF partner_ok THEN
    partner_amt := GREATEST(0, floor(gross * 0.10)::integer);
    creator_net := GREATEST(0, gross - partner_amt);
  ELSE
    partner_amt := 0;
    creator_net := gross;
    partner_uid := NULL;
  END IF;

  IF pay_id IS NULL THEN
    INSERT INTO public.payments (
      user_id,
      plan_type,
      amount,
      status,
      payment_provider,
      provider_payment_id,
      order_id,
      paid_at
    )
    VALUES (
      owner_uid,
      'reservation_booking',
      creator_net,
      'paid',
      'toss',
      trim(p_payment_key),
      trim(p_order_id),
      now ()
    )
    RETURNING id INTO pay_id;
  END IF;

  UPDATE public.reservations
  SET
    status = 'confirmed',
    payment_id = pay_id,
    payment_status = 'paid'
  WHERE id = p_reservation_id;

  IF partner_ok AND partner_amt > 0 THEN
    IF NOT EXISTS (SELECT 1 FROM public.partner_commissions pc WHERE pc.payment_id = pay_id) THEN
      INSERT INTO public.partner_commissions (
        payment_id, reservation_id, partner_user_id, card_id,
        gross_amount, partner_rate, partner_amount, creator_net_amount,
        settlement_status
      )
      VALUES (
        pay_id, r.id, partner_uid, r.card_id,
        gross, 0.10, partner_amt, creator_net,
        'pending'
      );
    END IF;
  END IF;

  RETURN pay_id;
END;
$$;

REVOKE ALL ON FUNCTION public.service_finalize_reservation_toss_payment (uuid, uuid, integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.service_finalize_reservation_toss_payment (uuid, uuid, integer, text, text) TO service_role;

-- ---------------------------------------------------------------------------
-- 9) 파트너 출금 신청 (confirmed 커미션만, 최소 10,000원)
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
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
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

-- ---------------------------------------------------------------------------
-- 10) 관리자 출금 처리 시 파트너 커미션 반영
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_set_withdrawal_request_status (
  p_request_id uuid,
  p_new_status text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  src text;
BEGIN
  IF NOT public.is_app_admin () THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF p_new_status NOT IN ('pending', 'approved', 'paid', 'rejected') THEN
    RAISE EXCEPTION 'invalid status';
  END IF;

  SELECT source_kind INTO src FROM public.withdrawal_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  UPDATE public.withdrawal_requests
  SET
    status = p_new_status,
    processed_at = CASE WHEN p_new_status IN ('paid', 'rejected') THEN now () ELSE processed_at END
  WHERE id = p_request_id;

  IF src = 'partner' THEN
    IF p_new_status = 'paid' THEN
      UPDATE public.partner_commissions
      SET settlement_status = 'paid'
      WHERE withdrawal_request_id = p_request_id AND settlement_status = 'confirmed';
    ELSIF p_new_status = 'rejected' THEN
      UPDATE public.partner_commissions
      SET withdrawal_request_id = NULL
      WHERE withdrawal_request_id = p_request_id;
    END IF;
  ELSE
    IF p_new_status = 'paid' THEN
      UPDATE public.referral_rewards
      SET status = 'paid'
      WHERE withdrawal_request_id = p_request_id AND status = 'confirmed';
    ELSIF p_new_status = 'rejected' THEN
      UPDATE public.referral_rewards
      SET withdrawal_request_id = NULL
      WHERE withdrawal_request_id = p_request_id;
    END IF;
  END IF;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_withdrawal_request_status (uuid, text) TO authenticated;
