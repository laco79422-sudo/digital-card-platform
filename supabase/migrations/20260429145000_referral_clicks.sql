-- 추천 링크 클릭 추적 + 보류 보상 14일 후 확정(추천인 본인 호출)

CREATE TABLE IF NOT EXISTS public.referral_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code text NOT NULL,
  referrer_user_id uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  visitor_user_agent text NULL,
  clicked_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS referral_clicks_referrer_idx ON public.referral_clicks (referrer_user_id);
CREATE INDEX IF NOT EXISTS referral_clicks_code_idx ON public.referral_clicks (referral_code);
CREATE INDEX IF NOT EXISTS referral_clicks_clicked_at_idx ON public.referral_clicks (clicked_at DESC);

-- 비회원 클릭도 허용: anon + authenticated 에서 호출
CREATE OR REPLACE FUNCTION public.record_referral_click(p_code text, p_user_agent text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized text;
  rid uuid;
BEGIN
  IF p_code IS NULL OR length(trim(p_code)) < 4 THEN
    RETURN;
  END IF;

  normalized := upper(trim(p_code));

  SELECT id INTO rid FROM public.profiles WHERE referral_code = normalized LIMIT 1;

  INSERT INTO public.referral_clicks (referral_code, referrer_user_id, visitor_user_agent)
  VALUES (normalized, rid, NULLIF(trim(p_user_agent), ''));
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_referral_click(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.record_referral_click(text, text) TO authenticated;

ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS referral_clicks_select_own ON public.referral_clicks;
CREATE POLICY referral_clicks_select_own ON public.referral_clicks FOR SELECT TO authenticated
  USING (referrer_user_id = auth.uid());

-- 로그인한 추천인 본인만 호출: 결제 후 14일이 지난 pending 보상을 confirmed 로 전환
CREATE OR REPLACE FUNCTION public.finalize_eligible_referrer_rewards()
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

  UPDATE public.referral_rewards
  SET status = 'confirmed', confirmed_at = COALESCE(confirmed_at, now())
  WHERE referrer_user_id = uid
    AND status = 'pending'
    AND created_at <= now() - INTERVAL '14 days';

  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

GRANT EXECUTE ON FUNCTION public.finalize_eligible_referrer_rewards() TO authenticated;
