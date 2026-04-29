-- 결제 직전 예약 금액 조정 (대기 상태 + 토큰 일치)
CREATE OR REPLACE FUNCTION public.update_reservation_pending_amount(
  p_id uuid,
  p_token uuid,
  p_amount_krw integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n int;
BEGIN
  IF p_amount_krw < 0 THEN RAISE EXCEPTION 'INVALID_AMOUNT'; END IF;
  UPDATE public.reservations
  SET amount_krw = p_amount_krw
  WHERE id = p_id AND booking_token = p_token AND status = 'pending';
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_reservation_pending_amount(uuid, uuid, integer) TO anon, authenticated;
