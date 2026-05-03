-- 헬퍼링크 캠페인: 가격 통일(19,900), 채널/목적 기타 텍스트, 요청사항
ALTER TABLE public.helper_campaigns
  ADD COLUMN IF NOT EXISTS price integer NOT NULL DEFAULT 19900,
  ADD COLUMN IF NOT EXISTS custom_channel_text text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS custom_goal_text text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS request_note text NOT NULL DEFAULT '';

COMMENT ON COLUMN public.helper_campaigns.price IS '헬퍼링크 상품 결제 금액(원), 기본 19900';
COMMENT ON COLUMN public.helper_campaigns.custom_channel_text IS '홍보 채널에서 기타 선택 시 상세';
COMMENT ON COLUMN public.helper_campaigns.custom_goal_text IS '홍보 목적 기타 선택 시 상세';
COMMENT ON COLUMN public.helper_campaigns.request_note IS '기타 요청사항';

UPDATE public.helper_campaigns SET price = 19900 WHERE price IS NULL OR price = 0;
