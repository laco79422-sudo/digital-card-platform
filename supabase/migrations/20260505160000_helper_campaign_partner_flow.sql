-- 헬퍼링크 파트너 캠페인 플로우 (결제자 캠페인 ↔ 파트너 지원 ↔ 전용 링크 ↔ 성과/상담)
-- 레거시: public.helpers, public.helper_links, public.card_events(share_type 등) 유지.

CREATE TABLE IF NOT EXISTS public.helper_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  card_id uuid NOT NULL REFERENCES public.business_cards(id) ON DELETE CASCADE,
  payment_id uuid,
  title text NOT NULL DEFAULT '',
  target_channels jsonb NOT NULL DEFAULT '[]'::jsonb,
  target_customer text NOT NULL DEFAULT '',
  region text NOT NULL DEFAULT '',
  goal text NOT NULL DEFAULT '',
  required_message text NOT NULL DEFAULT '',
  forbidden_message text NOT NULL DEFAULT '',
  budget text NOT NULL DEFAULT '',
  start_date date,
  end_date date,
  owner_note_for_partner text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','recruiting','active','completed','canceled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_helper_campaigns_owner ON public.helper_campaigns(owner_id);
CREATE INDEX IF NOT EXISTS idx_helper_campaigns_card ON public.helper_campaigns(card_id);
CREATE INDEX IF NOT EXISTS idx_helper_campaigns_status ON public.helper_campaigns(status);

ALTER TABLE public.helper_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "helper_campaigns_owner_all" ON public.helper_campaigns;
CREATE POLICY "helper_campaigns_owner_all"
  ON public.helper_campaigns FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "helper_campaigns_recruiting_read" ON public.helper_campaigns;
CREATE POLICY "helper_campaigns_recruiting_read"
  ON public.helper_campaigns FOR SELECT TO authenticated
  USING (status = 'recruiting');

GRANT SELECT, INSERT, UPDATE, DELETE ON public.helper_campaigns TO authenticated;

COMMENT ON TABLE public.helper_campaigns IS '헬퍼링크(유료) 캠페인 — 저장 후 recruiting 등';

CREATE TABLE IF NOT EXISTS public.helper_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  display_name text NOT NULL DEFAULT '',
  region text NOT NULL DEFAULT '',
  channels jsonb NOT NULL DEFAULT '[]'::jsonb,
  channel_detail text NOT NULL DEFAULT '',
  experience text NOT NULL DEFAULT '',
  strategy text NOT NULL DEFAULT '',
  can_consult boolean NOT NULL DEFAULT false,
  available_time text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  terms_ack_at timestamptz,
  referrer_signup_count_at_apply integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_helper_partners_user ON public.helper_partners(user_id);
-- 한 사용자당 파트너 프로필 1건 원칙(중복 신청 방지 — 앱 단에서 조회 확인)
CREATE INDEX IF NOT EXISTS idx_helper_partners_status ON public.helper_partners(status);

ALTER TABLE public.helper_partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "helper_partners_own_all" ON public.helper_partners;
CREATE POLICY "helper_partners_own_all"
  ON public.helper_partners FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "helper_partners_approved_read" ON public.helper_partners;
CREATE POLICY "helper_partners_approved_read"
  ON public.helper_partners FOR SELECT TO authenticated
  USING (status = 'approved');

DROP POLICY IF EXISTS "helper_partners_owner_reads_applicants" ON public.helper_partners;
CREATE POLICY "helper_partners_owner_reads_applicants"
  ON public.helper_partners FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.helper_partner_applications hpa
      INNER JOIN public.helper_campaigns hc ON hc.id = hpa.campaign_id
      WHERE hpa.partner_id = helper_partners.id AND hc.owner_id = auth.uid()
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.helper_partners TO authenticated;

COMMENT ON TABLE public.helper_partners IS '헬퍼링크 파트너 프로필 (스펙 §5 helper_partners)';

-- 파트너 지원 행 — 스펙 문서상 helper_applications 와 동일 역할 (SQL 예약 피함: 이름 유지 가능하나 명시적으로...)
CREATE TABLE IF NOT EXISTS public.helper_partner_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.helper_campaigns(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.helper_partners(id) ON DELETE CASCADE,
  proposed_channels jsonb NOT NULL DEFAULT '[]'::jsonb,
  promotion_method text NOT NULL DEFAULT '',
  target_audience text NOT NULL DEFAULT '',
  estimated_period text NOT NULL DEFAULT '',
  can_consult boolean NOT NULL DEFAULT false,
  proposal_message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'applied' CHECK (status IN ('applied','selected','rejected','canceled','completed')),
  partner_message text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, partner_id)
);

CREATE INDEX IF NOT EXISTS idx_hpa_campaign ON public.helper_partner_applications(campaign_id);
CREATE INDEX IF NOT EXISTS idx_hpa_partner ON public.helper_partner_applications(partner_id);

ALTER TABLE public.helper_partner_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hpa_partner_insert_own" ON public.helper_partner_applications;
CREATE POLICY "hpa_partner_insert_own"
  ON public.helper_partner_applications FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.helper_partners hp
      WHERE hp.id = partner_id AND hp.user_id = auth.uid()
        AND hp.status IN ('pending','approved')
    )
  );

DROP POLICY IF EXISTS "hpa_partner_select_own" ON public.helper_partner_applications;
CREATE POLICY "hpa_partner_select_own"
  ON public.helper_partner_applications FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.helper_partners hp WHERE hp.id = partner_id AND hp.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "hpa_partner_update_own" ON public.helper_partner_applications;
CREATE POLICY "hpa_partner_update_own"
  ON public.helper_partner_applications FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.helper_partners hp WHERE hp.id = partner_id AND hp.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.helper_partners hp WHERE hp.id = partner_id AND hp.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "hpa_owner_select" ON public.helper_partner_applications;
CREATE POLICY "hpa_owner_select"
  ON public.helper_partner_applications FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.helper_campaigns hc WHERE hc.id = campaign_id AND hc.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "hpa_owner_update" ON public.helper_partner_applications;
CREATE POLICY "hpa_owner_update"
  ON public.helper_partner_applications FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.helper_campaigns hc WHERE hc.id = campaign_id AND hc.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.helper_campaigns hc WHERE hc.id = campaign_id AND hc.owner_id = auth.uid())
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.helper_partner_applications TO authenticated;

COMMENT ON TABLE public.helper_partner_applications IS '파트너 캠페인 지원 (스펙 helper_applications)';

-- 스펙 §12 helper_links — 레거시 helper_links 와 충돌 방지 위해 campaign_share_links 로 생성
CREATE TABLE IF NOT EXISTS public.campaign_share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.helper_campaigns(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.helper_partners(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES public.business_cards(id) ON DELETE CASCADE,
  channel_id uuid REFERENCES public.card_channels(id) ON DELETE SET NULL,
  share_url text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_share_links_campaign ON public.campaign_share_links(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_share_links_partner ON public.campaign_share_links(partner_id);

ALTER TABLE public.campaign_share_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "csl_owner_partner_select" ON public.campaign_share_links;
CREATE POLICY "csl_owner_partner_select"
  ON public.campaign_share_links FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.helper_campaigns hc WHERE hc.id = campaign_id AND hc.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.helper_partners hp WHERE hp.id = partner_id AND hp.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "csl_owner_insert" ON public.campaign_share_links;
CREATE POLICY "csl_owner_insert"
  ON public.campaign_share_links FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.helper_campaigns hc WHERE hc.id = campaign_id AND hc.owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "csl_owner_update" ON public.campaign_share_links;
CREATE POLICY "csl_owner_update"
  ON public.campaign_share_links FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.helper_campaigns hc WHERE hc.id = campaign_id AND hc.owner_id = auth.uid())
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_share_links TO authenticated;

CREATE TABLE IF NOT EXISTS public.helper_consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES public.business_cards(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.helper_campaigns(id) ON DELETE SET NULL,
  helper_partner_id uuid REFERENCES public.helper_partners(id) ON DELETE SET NULL,
  channel_id uuid REFERENCES public.card_channels(id) ON DELETE SET NULL,
  customer_name text NOT NULL DEFAULT '',
  customer_contact text NOT NULL DEFAULT '',
  memo text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','in_progress','done','contract','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_helper_consultations_card ON public.helper_consultations(card_id);
CREATE INDEX IF NOT EXISTS idx_helper_consultations_campaign ON public.helper_consultations(campaign_id);

ALTER TABLE public.helper_consultations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hc_consult_select" ON public.helper_consultations;
CREATE POLICY "hc_consult_select"
  ON public.helper_consultations FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.business_cards bc WHERE bc.id = card_id AND bc.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.helper_campaigns hc WHERE hc.id = campaign_id AND hc.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.helper_partners hp WHERE hp.id = helper_partner_id AND hp.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "hc_consult_insert" ON public.helper_consultations;
CREATE POLICY "hc_consult_insert"
  ON public.helper_consultations FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.business_cards bc WHERE bc.id = card_id AND bc.user_id = auth.uid())
    OR (
      helper_partner_id IS NOT NULL
      AND EXISTS (SELECT 1 FROM public.helper_partners hp WHERE hp.id = helper_partner_id AND hp.user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "hc_consult_update" ON public.helper_consultations;
CREATE POLICY "hc_consult_update"
  ON public.helper_consultations FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.business_cards bc WHERE bc.id = card_id AND bc.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.helper_partners hp WHERE hp.id = helper_partner_id AND hp.user_id = auth.uid())
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.helper_consultations TO authenticated;

ALTER TABLE public.card_events
  ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.helper_campaigns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS helper_partner_id uuid REFERENCES public.helper_partners(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_card_events_campaign ON public.card_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_card_events_helper_partner ON public.card_events(helper_partner_id);
