-- 업종 선택 구조(일반 / linko_member 등) — 앱 JSON
ALTER TABLE public.business_cards
  ADD COLUMN IF NOT EXISTS card_industry jsonb;

COMMENT ON COLUMN public.business_cards.card_industry IS '업종 선택 페이로드: { group, type, label } 등';
