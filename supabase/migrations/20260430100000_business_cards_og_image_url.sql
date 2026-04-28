-- Kakao/SNS OG 전용 대표 이미지 (없으면 image_url 등과 동일하게 앱에서 채움)
ALTER TABLE public.business_cards
  ADD COLUMN IF NOT EXISTS og_image_url text;
