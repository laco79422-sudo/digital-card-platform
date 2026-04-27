CREATE TABLE IF NOT EXISTS public.card_promotion_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id TEXT NOT NULL,
  ref_code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'promotion',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS card_promotion_links_card_id_idx ON public.card_promotion_links (card_id);
CREATE INDEX IF NOT EXISTS card_promotion_links_ref_code_idx ON public.card_promotion_links (ref_code);

ALTER TABLE public.card_promotion_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "card_promotion_links_select_public" ON public.card_promotion_links;
CREATE POLICY "card_promotion_links_select_public"
  ON public.card_promotion_links
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "card_promotion_links_insert_public" ON public.card_promotion_links;
CREATE POLICY "card_promotion_links_insert_public"
  ON public.card_promotion_links
  FOR INSERT
  WITH CHECK (type = 'promotion');

