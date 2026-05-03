-- 헬퍼 캠페인: 채널별 전용 링크(campaign_share_links) 식별, card_events·consultations 연계

-- 1) campaign_share_links: 프로모 채널 키(카카오톡 등) + 동일 캠페인·파트너·채널 중복 방지
ALTER TABLE public.campaign_share_links
  ADD COLUMN IF NOT EXISTS promo_channel_key text NOT NULL DEFAULT '';

COMMENT ON COLUMN public.campaign_share_links.promo_channel_key IS 'HELPER_PROMO_CHANNELS id (kakao, blog, other 등); URL의 channel= 는 행 id(uuid)로 전달';

CREATE UNIQUE INDEX IF NOT EXISTS campaign_share_links_campaign_partner_channel_uidx
  ON public.campaign_share_links (campaign_id, partner_id, promo_channel_key);

-- 2) card_events: 전용 링크 행 추적 + UA (ip_hash는 기존 컬럼)
ALTER TABLE public.card_events
  ADD COLUMN IF NOT EXISTS campaign_share_link_id uuid REFERENCES public.campaign_share_links(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS user_agent text NULL;

CREATE INDEX IF NOT EXISTS idx_card_events_campaign_share_link ON public.card_events(campaign_share_link_id);

COMMENT ON COLUMN public.card_events.campaign_share_link_id IS '헬퍼 캠페인 URL의 channel= 로 전달된 campaign_share_links.id';

-- 3) consultations: 캠페인·파트너 유입 연결 (nullable — 기존 행 호환)

ALTER TABLE public.consultations
  ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.helper_campaigns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS helper_partner_id uuid REFERENCES public.helper_partners(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS channel_link_id uuid REFERENCES public.campaign_share_links(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_consultations_campaign ON public.consultations(campaign_id);

DO $$
DECLARE
  cname text;
BEGIN
  SELECT con.conname INTO cname
  FROM pg_constraint con
  WHERE con.conrelid = 'public.consultations'::regclass
    AND con.contype = 'c'
    AND EXISTS (
      SELECT 1 FROM unnest(con.conkey) AS ck(attnum)
      JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = ck.attnum
      WHERE a.attname = 'status'
    )
  LIMIT 1;
  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.consultations DROP CONSTRAINT %I', cname);
  END IF;
END $$;

ALTER TABLE public.consultations
  ADD CONSTRAINT consultations_status_check
  CHECK (
    status IN (
      'new',
      'read',
      'closed',
      'contacted',
      'consulting',
      'completed',
      'canceled'
    )
  );

COMMENT ON COLUMN public.consultations.campaign_id IS '헬퍼 캠페인 유입 시 연결';
