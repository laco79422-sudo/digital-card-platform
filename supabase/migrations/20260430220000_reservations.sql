-- 고객 예약 → 결제(데모) 연결
CREATE TABLE IF NOT EXISTS public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES public.business_cards (id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  phone text NOT NULL,
  service_name text NOT NULL DEFAULT '',
  reservation_date date NOT NULL,
  time_slot text NOT NULL,
  amount_krw integer NOT NULL DEFAULT 10000 CHECK (amount_krw >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  booking_token uuid NOT NULL DEFAULT gen_random_uuid (),
  payment_id uuid NULL REFERENCES public.payments (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS reservations_booking_token_uidx ON public.reservations (booking_token);
CREATE INDEX IF NOT EXISTS reservations_card_id_idx ON public.reservations (card_id);
CREATE INDEX IF NOT EXISTS reservations_status_idx ON public.reservations (status);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reservations_insert_public ON public.reservations;
CREATE POLICY reservations_insert_public ON public.reservations FOR INSERT TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.business_cards bc
    WHERE bc.id = card_id AND bc.is_public = true
  )
);

DROP POLICY IF EXISTS reservations_select_owner ON public.reservations;
CREATE POLICY reservations_select_owner ON public.reservations FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.business_cards bc
    WHERE bc.id = reservations.card_id
      AND (bc.user_id = auth.uid () OR bc.owner_id = auth.uid ())
  )
);

GRANT INSERT ON public.reservations TO anon, authenticated;
GRANT SELECT ON public.reservations TO authenticated;

COMMENT ON TABLE public.reservations IS '공개 명함 예약 요청 — 결제 연결 시 status confirmed';

-- 결제 페이지 조회 (토큰 검증, 공개)
CREATE OR REPLACE FUNCTION public.get_reservation_for_payment(p_id uuid, p_token uuid)
RETURNS TABLE (
  id uuid,
  card_id uuid,
  customer_name text,
  phone text,
  service_name text,
  reservation_date date,
  time_slot text,
  amount_krw integer,
  status text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.card_id, r.customer_name, r.phone, r.service_name, r.reservation_date, r.time_slot,
         r.amount_krw, r.status, r.created_at
  FROM public.reservations r
  WHERE r.id = p_id AND r.booking_token = p_token AND r.status = 'pending';
$$;

GRANT EXECUTE ON FUNCTION public.get_reservation_for_payment(uuid, uuid) TO anon, authenticated;

-- 데모 결제: 카드 소유자 user_id 로 payments 기록 + 예약 확정
CREATE OR REPLACE FUNCTION public.confirm_reservation_demo_payment(p_reservation_id uuid, p_token uuid)
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
BEGIN
  SELECT * INTO r FROM public.reservations WHERE id = p_reservation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND';
  END IF;
  IF r.booking_token IS DISTINCT FROM p_token THEN RAISE EXCEPTION 'TOKEN';
  END IF;
  IF r.status <> 'pending' THEN RAISE EXCEPTION 'INVALID_STATE';
  END IF;
  IF r.created_at < now() - interval '48 hours' THEN RAISE EXCEPTION 'EXPIRED'; END IF;

  SELECT bc.user_id INTO owner_uid
  FROM public.business_cards bc
  WHERE bc.id = r.card_id AND bc.is_public = true;
  IF owner_uid IS NULL THEN RAISE EXCEPTION 'CARD';

  prov := 'reservation-' || replace(p_reservation_id::text, '-', '');

  SELECT p.id INTO pay_id FROM public.payments p
  WHERE p.payment_provider = 'demo' AND p.provider_payment_id = prov;

  IF pay_id IS NULL THEN
    INSERT INTO public.payments (user_id, plan_type, amount, status, payment_provider, provider_payment_id)
    VALUES (owner_uid, 'reservation_booking', r.amount_krw, 'paid', 'demo', prov)
    RETURNING id INTO pay_id;
  END IF;

  UPDATE public.reservations
  SET status = 'confirmed', payment_id = pay_id
  WHERE id = p_reservation_id;

  RETURN pay_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_reservation_demo_payment(uuid, uuid) TO anon, authenticated;
