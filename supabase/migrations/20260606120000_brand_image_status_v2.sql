-- 대표 이미지 검수 상태: pending_review / approved / rejected_manual (+ 레거시 마이그레이션)

ALTER TABLE public.business_cards DROP CONSTRAINT IF EXISTS business_cards_brand_image_status_check;

UPDATE public.business_cards
SET brand_image_status = 'pending_review'
WHERE brand_image_status = 'pending';

UPDATE public.business_cards
SET brand_image_status = 'rejected_manual'
WHERE brand_image_status = 'rejected';

ALTER TABLE public.business_cards
  ADD CONSTRAINT business_cards_brand_image_status_check CHECK (
    brand_image_status IS NULL
    OR brand_image_status IN ('pending_review', 'approved', 'rejected_manual')
  );

COMMENT ON COLUMN public.business_cards.brand_image_status IS
  'pending_review: 1차 통과·관리자 대기 | approved | rejected_manual';
