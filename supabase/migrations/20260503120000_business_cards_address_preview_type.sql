-- 매장형 주소·영업 안내 및 공유 카드 레이아웃(preview) 저장
ALTER TABLE public.business_cards
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS preview_card_type text DEFAULT 'person';

COMMENT ON COLUMN public.business_cards.address IS '매장·위치 명함 등 주소 또는 영업시간·방문 안내 문구';
COMMENT ON COLUMN public.business_cards.preview_card_type IS '공유 카드 레이아웃: person | store | location | result | event | trust';
