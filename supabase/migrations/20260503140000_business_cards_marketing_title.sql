-- 이미지형 명함 상단 큰 제목(문구 우선 레이아웃)
ALTER TABLE public.business_cards
  ADD COLUMN IF NOT EXISTS marketing_title text;

COMMENT ON COLUMN public.business_cards.marketing_title IS '이미지형·히어로 큰 제목 — 한 줄 소개·상세와 별도';
