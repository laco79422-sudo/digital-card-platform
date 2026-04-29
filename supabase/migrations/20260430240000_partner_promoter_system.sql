-- 파트너(홍보자) 프로그램: 프로필 플래그, 조회·클릭·예약·결제 추적, 10% 보상

-- 1) 프로필
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_partner boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS partner_activated_at timestamptz NULL;

COMMENT ON COLUMN public.profiles.is_partner IS '홍보 파트너 활성화 여부';

-- 2) card_visit_logs — 파트너 UUID 추적 + 제약 갱신
ALTER TABLE public.card_visit_logs
  ADD COLUMN IF NOT EXISTS partner_user_id uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL;

ALTER TABLE public.card_visit_logs DROP CONSTRAINT IF EXISTS card_visit_logs_promoter_when_promotion;

ALTER TABLE public.card_visit_logs
  ADD CONSTRAINT card_visit_logs_promotion_attribution_chk CHECK (
    (
      source = 'promotion'
      AND (promoter_code IS NOT NULL OR partner_user_id IS NOT NULL)
    )
    OR (
      source = 'direct'
      AND promoter_code IS NULL
      AND partner_user_id IS NULL
    )
  );

CREATE INDEX IF NOT EXISTS idx_card_visit_logs_partner_uid ON public.card_visit_logs (partner_user_id)
  WHERE partner_user_id IS NOT NULL;

DROP POLICY IF EXISTS "Partners uid select promotion visits" ON public.card_visit_logs;

CREATE POLICY "Partners uid select promotion visits"
  ON public.card_visit_logs FOR SELECT TO authenticated
  USING (
    partner_user_id IS NOT NULL
    AND partner_user_id = auth.uid ()
    AND EXISTS (
      SELECT 1 FROM public.profiles pf WHERE pf.id = auth.uid () AND pf.is_partner = true
    )
  );

-- 3) card_views
ALTER TABLE public.card_views
  ADD COLUMN IF NOT EXISTS partner_user_id uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_card_views_partner_uid ON public.card_views (partner_user_id)
  WHERE partner_user_id IS NOT NULL;

DROP POLICY IF EXISTS "Partners select card_views attributed" ON public.card_views;

CREATE POLICY "Partners select card_views attributed"
  ON public.card_views FOR SELECT TO authenticated
  USING (
    partner_user_id IS NOT NULL
    AND partner_user_id = auth.uid ()
    AND EXISTS (
      SELECT 1 FROM public.profiles pf WHERE pf.id = auth.uid () AND pf.is_partner = true
    )
  );

-- 4) card_action_logs
ALTER TABLE public.card_action_logs
  ADD COLUMN IF NOT EXISTS partner_user_id uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_card_action_logs_partner_uid ON public.card_action_logs (partner_user_id)
  WHERE partner_user_id IS NOT NULL;

DROP POLICY IF EXISTS "Partners select card_action_logs attributed" ON public.card_action_logs;

CREATE POLICY "Partners select card_action_logs attributed"
  ON public.card_action_logs FOR SELECT TO authenticated
  USING (
    partner_user_id IS NOT NULL
    AND partner_user_id = auth.uid ()
    AND EXISTS (
      SELECT 1 FROM public.profiles pf WHERE pf.id = auth.uid () AND pf.is_partner = true
    )
  );

-- 5) reservations — 공개 INSERT 시 파트너만 허용
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS partner_user_id uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reservations_partner_uid ON public.reservations (partner_user_id)
  WHERE partner_user_id IS NOT NULL;

DROP POLICY IF EXISTS reservations_insert_public ON public.reservations;

CREATE POLICY reservations_insert_public ON public.reservations FOR INSERT TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.business_cards bc
    WHERE bc.id = card_id AND bc.is_public = true
  )
  AND (
    reservations.partner_user_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.profiles pr
      WHERE pr.id = reservations.partner_user_id AND pr.is_partner = true
    )
  )
);

DROP POLICY IF EXISTS reservations_partner_select ON public.reservations;

CREATE POLICY reservations_partner_select ON public.reservations FOR SELECT TO authenticated
USING (
  partner_user_id IS NOT NULL
  AND partner_user_id = auth.uid ()
  AND EXISTS (
    SELECT 1 FROM public.profiles pf WHERE pf.id = auth.uid () AND pf.is_partner = true
  )
);

-- 6) 파트너 홍보 수익 (예약 결제 기준 10%)
CREATE TABLE IF NOT EXISTS public.partner_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  payment_id uuid NOT NULL REFERENCES public.payments (id) ON DELETE CASCADE,
  reservation_id uuid NULL REFERENCES public.reservations (id) ON DELETE SET NULL,
  partner_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES public.business_cards (id) ON DELETE CASCADE,
  gross_amount integer NOT NULL CHECK (gross_amount >= 0),
  partner_rate numeric NOT NULL DEFAULT 0.10,
  partner_amount integer NOT NULL CHECK (partner_amount >= 0),
  creator_net_amount integer NOT NULL CHECK (creator_net_amount >= 0),
  created_at timestamptz NOT NULL DEFAULT now ()
);

CREATE INDEX IF NOT EXISTS idx_partner_commissions_partner ON public.partner_commissions (partner_user_id);
CREATE INDEX IF NOT EXISTS idx_partner_commissions_payment ON public.partner_commissions (payment_id);

ALTER TABLE public.partner_commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS partner_commissions_select_own ON public.partner_commissions;

CREATE POLICY partner_commissions_select_own ON public.partner_commissions FOR SELECT TO authenticated
USING (partner_user_id = auth.uid ());

GRANT SELECT ON public.partner_commissions TO authenticated;

COMMENT ON TABLE public.partner_commissions IS '명함 예약 결제 시 파트너 홍보 수익 (고객 결제액의 10%)';

-- 7) 파트너 활성화 RPC
CREATE OR REPLACE FUNCTION public.activate_partner_program()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid ();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  INSERT INTO public.profiles (id, referral_code, is_partner, partner_activated_at)
  VALUES (uid, public.ensure_unique_referral_code (), true, now ())
  ON CONFLICT (id) DO UPDATE SET
    is_partner = true,
    partner_activated_at = COALESCE(public.profiles.partner_activated_at, EXCLUDED.partner_activated_at),
    updated_at = now ();

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.activate_partner_program() TO authenticated;

-- 8) 예약 결제 확정 — 크리에이터(명함 소유자) net + 파트너 10%
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
      SELECT 1 FROM public.profiles pf WHERE pf.id = partner_uid AND pf.is_partner = true AND pf.id <> owner_uid
    )
    INTO partner_ok;
  END IF;

  IF partner_ok THEN
    partner_amt := GREATEST (0, floor(gross * 0.10)::integer);
    creator_net := GREATEST (0, gross - partner_amt);
  ELSE
    partner_amt := 0;
    creator_net := gross;
    partner_uid := NULL;
  END IF;

  prov := 'reservation-' || replace(p_reservation_id::text, '-', '');

  SELECT p.id INTO pay_id FROM public.payments p
  WHERE p.payment_provider = 'demo' AND p.provider_payment_id = prov;

  IF pay_id IS NULL THEN
    INSERT INTO public.payments (user_id, plan_type, amount, status, payment_provider, provider_payment_id)
    VALUES (owner_uid, 'reservation_booking', creator_net, 'paid', 'demo', prov)
    RETURNING id INTO pay_id;
  END IF;

  UPDATE public.reservations
  SET status = 'confirmed', payment_id = pay_id
  WHERE id = p_reservation_id;

  IF partner_ok AND partner_amt > 0 THEN
    INSERT INTO public.partner_commissions (
      payment_id, reservation_id, partner_user_id, card_id,
      gross_amount, partner_rate, partner_amount, creator_net_amount
    )
    VALUES (
      pay_id, r.id, partner_uid, r.card_id,
      gross, 0.10, partner_amt, creator_net
    );
  END IF;

  RETURN pay_id;
END;
$$;

-- 9) 리더보드 (연결 점수)
CREATE OR REPLACE FUNCTION public.partner_connection_leaderboard(p_limit integer DEFAULT 30)
RETURNS TABLE(leaderboard_rank bigint, partner_user_id uuid, connection_score bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH partner_ids AS (
    SELECT p.id AS uid
    FROM public.profiles p
    WHERE p.is_partner = true
  ),
  agg AS (
    SELECT
      pi.uid,
      (
        COALESCE((SELECT COUNT(*)::bigint FROM public.card_visit_logs v WHERE v.partner_user_id = pi.uid), 0)
        + COALESCE((SELECT COUNT(*)::bigint FROM public.card_views cv WHERE cv.partner_user_id = pi.uid), 0)
        + COALESCE((SELECT COUNT(*)::bigint FROM public.card_action_logs ca WHERE ca.partner_user_id = pi.uid), 0)
        + COALESCE((SELECT COUNT(*)::bigint FROM public.reservations rv WHERE rv.partner_user_id = pi.uid), 0) * 5
        + COALESCE((SELECT COUNT(*)::bigint FROM public.partner_commissions pc WHERE pc.partner_user_id = pi.uid), 0) * 15
      ) AS sc
    FROM partner_ids pi
  ),
  ranked AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY agg.sc DESC, agg.uid ASC)::bigint AS rk,
      agg.uid AS pid,
      agg.sc::bigint AS cs
    FROM agg
    WHERE agg.sc > 0
  )
  SELECT r.rk AS leaderboard_rank, r.pid AS partner_user_id, r.cs AS connection_score
  FROM ranked r
  ORDER BY r.rk ASC
  LIMIT COALESCE(NULLIF(p_limit, 0), 30);
END;
$$;

GRANT EXECUTE ON FUNCTION public.partner_connection_leaderboard(integer) TO anon, authenticated;

-- 10) 파트너 대시보드 집계(JSON) — business_cards 조회는 SECURITY DEFINER 로만
CREATE OR REPLACE FUNCTION public.partner_dashboard_snapshot()
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid ();
  view_visits bigint;
  view_remote bigint;
  clicks bigint;
  res_ct bigint;
  pay_ct bigint;
  revenue bigint;
  cards json;
BEGIN
  IF uid IS NULL THEN RETURN json_build_object('error', 'auth'); END IF;

  SELECT COUNT(*) INTO view_visits FROM public.card_visit_logs WHERE partner_user_id = uid;
  SELECT COUNT(*) INTO view_remote FROM public.card_views WHERE partner_user_id = uid;
  SELECT COUNT(*) INTO clicks FROM public.card_action_logs WHERE partner_user_id = uid;
  SELECT COUNT(*) INTO res_ct FROM public.reservations WHERE partner_user_id = uid;
  SELECT COUNT(*) INTO pay_ct FROM public.partner_commissions WHERE partner_user_id = uid;
  SELECT COALESCE(SUM(partner_amount), 0)::bigint INTO revenue FROM public.partner_commissions WHERE partner_user_id = uid;

  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO cards
  FROM (
    SELECT DISTINCT ON (bc.id)
      bc.id,
      bc.slug,
      bc.person_name,
      bc.brand_name
    FROM public.business_cards bc
    WHERE bc.id IN (
      SELECT card_id FROM public.card_visit_logs WHERE partner_user_id = uid
      UNION SELECT card_id FROM public.card_views WHERE partner_user_id = uid
      UNION SELECT card_id FROM public.card_action_logs WHERE partner_user_id = uid
      UNION SELECT card_id FROM public.reservations WHERE partner_user_id = uid
      UNION SELECT card_id FROM public.partner_commissions WHERE partner_user_id = uid
    )
    ORDER BY bc.id, bc.updated_at DESC NULLS LAST
    LIMIT 80
  ) t;

  RETURN json_build_object(
    'visit_logs_count', view_visits,
    'card_views_count', view_remote,
    'total_views', view_visits + view_remote,
    'click_count', clicks,
    'reservation_count', res_ct,
    'payment_count', pay_ct,
    'partner_revenue_krw', revenue,
    'promoted_cards', COALESCE(cards, '[]'::json)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.partner_dashboard_snapshot() TO authenticated;
