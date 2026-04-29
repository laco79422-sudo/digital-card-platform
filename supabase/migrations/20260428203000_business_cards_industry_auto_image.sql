-- 업종 라벨 · 템플릿 기본 히어로/OG 이미지 URL (공유 미리보기·통계용)
ALTER TABLE public.business_cards
  ADD COLUMN IF NOT EXISTS industry text;

ALTER TABLE public.business_cards
  ADD COLUMN IF NOT EXISTS auto_image_url text;

COMMENT ON COLUMN public.business_cards.industry IS '표시용 업종명 (예: 세차장)';
COMMENT ON COLUMN public.business_cards.auto_image_url IS '업종 템플릿 기본 히어로 이미지 절대 URL';
COMMENT ON COLUMN public.business_cards.og_image_url IS 'OG·카카오 공유용 이미지 절대 URL (합성 PNG 확장 예정)';
