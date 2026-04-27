ALTER TABLE public.business_cards
ADD COLUMN IF NOT EXISTS expire_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

UPDATE public.business_cards
SET
  expire_at = COALESCE(expire_at, created_at + INTERVAL '30 days'),
  status = COALESCE(status, 'active');

CREATE TABLE IF NOT EXISTS public.card_link_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id TEXT NOT NULL,
  slug TEXT NOT NULL,
  ref_code TEXT NOT NULL,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  page_path TEXT NOT NULL,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS card_link_visits_card_id_idx ON public.card_link_visits (card_id);
CREATE INDEX IF NOT EXISTS card_link_visits_ref_code_idx ON public.card_link_visits (ref_code);

ALTER TABLE public.card_link_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "card_link_visits_insert_public" ON public.card_link_visits;
CREATE POLICY "card_link_visits_insert_public"
  ON public.card_link_visits
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "card_link_visits_select_public" ON public.card_link_visits;
CREATE POLICY "card_link_visits_select_public"
  ON public.card_link_visits
  FOR SELECT
  USING (true);

