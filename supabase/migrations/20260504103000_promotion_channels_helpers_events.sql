-- 채널 기반 유료 홍보 + 직접/헬퍼 구분 성과 저장
-- 공개 주소: /c/{slug}?channel=&type=direct|helper&helper=

CREATE TABLE IF NOT EXISTS public.card_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  card_id uuid NOT NULL REFERENCES public.business_cards(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('kakao','daangn','blog','youtube','acquaintances','instagram','sms','community','custom')),
  is_paid boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_card_channels_card ON public.card_channels(card_id);
CREATE INDEX IF NOT EXISTS idx_card_channels_user ON public.card_channels(user_id);

ALTER TABLE public.card_channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "card_channels_owner_select" ON public.card_channels;
CREATE POLICY "card_channels_owner_select"
  ON public.card_channels FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "card_channels_owner_insert" ON public.card_channels;
CREATE POLICY "card_channels_owner_insert"
  ON public.card_channels FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "card_channels_owner_update" ON public.card_channels;
CREATE POLICY "card_channels_owner_update"
  ON public.card_channels FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "card_channels_owner_delete" ON public.card_channels;
CREATE POLICY "card_channels_owner_delete"
  ON public.card_channels FOR DELETE TO authenticated
  USING (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.card_channels TO authenticated;

CREATE TABLE IF NOT EXISTS public.helpers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('pending','active','disabled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_helpers_user ON public.helpers(user_id);

ALTER TABLE public.helpers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "helpers_self_all" ON public.helpers;
CREATE POLICY "helpers_self_all"
  ON public.helpers FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.helpers TO authenticated;

CREATE TABLE IF NOT EXISTS public.helper_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  helper_id uuid NOT NULL REFERENCES public.helpers(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES public.business_cards(id) ON DELETE CASCADE,
  channel_id uuid REFERENCES public.card_channels(id) ON DELETE SET NULL,
  share_url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (helper_id, card_id, channel_id)
);

CREATE INDEX IF NOT EXISTS idx_helper_links_card ON public.helper_links(card_id);
CREATE INDEX IF NOT EXISTS idx_helper_links_helper ON public.helper_links(helper_id);

ALTER TABLE public.helper_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "helper_links_partner_or_card_owner_select" ON public.helper_links;
CREATE POLICY "helper_links_partner_or_card_owner_select"
  ON public.helper_links FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.helpers h WHERE h.id = helper_links.helper_id AND h.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.business_cards bc WHERE bc.id = helper_links.card_id AND bc.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "helper_links_helper_manage" ON public.helper_links;
CREATE POLICY "helper_links_helper_manage"
  ON public.helper_links FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.helpers h WHERE h.id = helper_links.helper_id AND h.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.business_cards bc WHERE bc.id = helper_links.card_id AND bc.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "helper_links_helper_manage_update" ON public.helper_links;
CREATE POLICY "helper_links_helper_manage_update"
  ON public.helper_links FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.helpers h WHERE h.id = helper_links.helper_id AND h.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.business_cards bc WHERE bc.id = helper_links.card_id AND bc.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.helpers h WHERE h.id = helper_links.helper_id AND h.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.business_cards bc WHERE bc.id = helper_links.card_id AND bc.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "helper_links_helper_manage_delete" ON public.helper_links;
CREATE POLICY "helper_links_helper_manage_delete"
  ON public.helper_links FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.helpers h WHERE h.id = helper_links.helper_id AND h.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.business_cards bc WHERE bc.id = helper_links.card_id AND bc.user_id = auth.uid())
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.helper_links TO authenticated;

CREATE TABLE IF NOT EXISTS public.card_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES public.business_cards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  channel_id uuid REFERENCES public.card_channels(id) ON DELETE SET NULL,
  share_type text NOT NULL CHECK (share_type IN ('direct','helper')),
  helper_id uuid REFERENCES public.helpers(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('view','contact_click','call_click','kakao_click','form_submit')),
  button_type text,
  visitor_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_card_events_card ON public.card_events(card_id);
CREATE INDEX IF NOT EXISTS idx_card_events_user ON public.card_events(user_id);
CREATE INDEX IF NOT EXISTS idx_card_events_channel ON public.card_events(channel_id);

ALTER TABLE public.card_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "card_events_public_insert" ON public.card_events;
CREATE POLICY "card_events_public_insert"
  ON public.card_events FOR INSERT TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "card_events_owner_select" ON public.card_events;
CREATE POLICY "card_events_owner_select"
  ON public.card_events FOR SELECT TO authenticated
  USING (user_id = auth.uid());

GRANT INSERT ON public.card_events TO anon, authenticated;
GRANT SELECT ON public.card_events TO authenticated;
