-- 공개 명함 CTA 클릭·문의 로그 (내 공간 성과 집계용)

CREATE TABLE IF NOT EXISTS public.card_action_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES public.business_cards(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL,
  action_type text NOT NULL,
  action_label text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_card_action_logs_owner ON public.card_action_logs(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_card_action_logs_card ON public.card_action_logs(card_id);

ALTER TABLE public.card_action_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "card_action_logs_insert_public" ON public.card_action_logs;
CREATE POLICY "card_action_logs_insert_public"
  ON public.card_action_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "card_action_logs_select_owner" ON public.card_action_logs;
CREATE POLICY "card_action_logs_select_owner"
  ON public.card_action_logs FOR SELECT
  TO authenticated
  USING (owner_user_id = auth.uid());

GRANT INSERT ON public.card_action_logs TO anon, authenticated;
GRANT SELECT ON public.card_action_logs TO authenticated;

CREATE TABLE IF NOT EXISTS public.inquiry_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES public.business_cards(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL,
  inquiry_type text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inquiry_logs_owner ON public.inquiry_logs(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_logs_card ON public.inquiry_logs(card_id);

ALTER TABLE public.inquiry_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inquiry_logs_insert_public" ON public.inquiry_logs;
CREATE POLICY "inquiry_logs_insert_public"
  ON public.inquiry_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "inquiry_logs_select_owner" ON public.inquiry_logs;
CREATE POLICY "inquiry_logs_select_owner"
  ON public.inquiry_logs FOR SELECT
  TO authenticated
  USING (owner_user_id = auth.uid());

GRANT INSERT ON public.inquiry_logs TO anon, authenticated;
GRANT SELECT ON public.inquiry_logs TO authenticated;
