-- 추천 링크 메인 유입 로그 (?ref=). 비회원 INSERT 허용(RPC). 추천인은 자신 코드 행만 SELECT.

CREATE TABLE IF NOT EXISTS public.referral_link_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  referral_code text NOT NULL,
  visited_at timestamptz NOT NULL DEFAULT now(),
  landing_path text NULL,
  user_agent text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS referral_link_visits_code_idx ON public.referral_link_visits (referral_code);

CREATE INDEX IF NOT EXISTS referral_link_visits_visited_at_idx ON public.referral_link_visits (visited_at DESC);

COMMENT ON TABLE public.referral_link_visits IS '메인 등에서 ?ref= 유입 시 세션당 1회 기록(클라이언트 중복 방지)';

-- 비회원·회원 모두 호출 가능
CREATE OR REPLACE FUNCTION public.record_referral_link_visit(
  p_code text,
  p_landing_path text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
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
    SELECT 1 FROM public.profiles WHERE referral_code = normalized LIMIT 1
  )
  INTO exists_profile;

  IF NOT exists_profile THEN
    RETURN;
  END IF;

  INSERT INTO public.referral_link_visits (referral_code, landing_path, user_agent)
  VALUES (
    normalized,
    NULLIF(trim(COALESCE(p_landing_path, '')), ''),
    NULLIF(trim(COALESCE(p_user_agent, '')), '')
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_referral_link_visit(text, text, text) TO anon;

GRANT EXECUTE ON FUNCTION public.record_referral_link_visit(text, text, text) TO authenticated;

ALTER TABLE public.referral_link_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS referral_link_visits_select_as_referrer ON public.referral_link_visits;

CREATE POLICY referral_link_visits_select_as_referrer ON public.referral_link_visits FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid ()
      AND p.referral_code = referral_link_visits.referral_code
  )
);

-- 회원가입 화면: 추천 코드로 초대자 표시용 (코드만 노출해도 됨)
CREATE OR REPLACE FUNCTION public.preview_referrer_for_signup(p_code text)
RETURNS TABLE (
  referral_code text,
  display_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized text;
BEGIN
  IF p_code IS NULL OR length(trim(p_code)) < 4 THEN
    RETURN;
  END IF;

  normalized := upper(trim(p_code));

  RETURN QUERY
  SELECT
    p.referral_code,
    COALESCE(
      NULLIF(trim(COALESCE(u.raw_user_meta_data ->> 'name', '')), ''),
      NULLIF(trim(COALESCE(u.raw_user_meta_data ->> 'full_name', '')), ''),
      ''
    )::text AS display_name
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.referral_code = normalized
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.preview_referrer_for_signup(text) TO anon;

GRANT EXECUTE ON FUNCTION public.preview_referrer_for_signup(text) TO authenticated;
