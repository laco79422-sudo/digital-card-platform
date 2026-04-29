-- 클라이언트에서 public.ads 직접 조회(list_public_reward_ads RPC 대체 경로) 시 필요한 공개 SELECT
-- anon · authenticated 가 활성·예산 충분한 노출 대행만 조회 가능

DROP POLICY IF EXISTS ads_select_public_active ON public.ads;

CREATE POLICY ads_select_public_active ON public.ads FOR SELECT TO anon,
authenticated USING (
  status = 'active'
  AND budget >= cost_per_click
  AND ad_type IN ('banner', 'click_reward')
);

GRANT SELECT ON TABLE public.ads TO anon;

-- 구 호출부(public.crowd_ads) 호환: 함수 미존재 오류 방지
CREATE OR REPLACE FUNCTION public.crowd_ads ()
RETURNS SETOF public.ads
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.ads
  WHERE
    status = 'active'
    AND budget >= cost_per_click
    AND ad_type IN ('banner', 'click_reward')
  ORDER BY
    created_at DESC
  LIMIT 10;
$$;

GRANT EXECUTE ON FUNCTION public.crowd_ads () TO anon,
authenticated;
