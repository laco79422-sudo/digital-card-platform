-- 카드 소유자: user_id 또는 owner_id
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

  SELECT COALESCE(bc.user_id, bc.owner_id) INTO owner_uid
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
