-- Temp preview payloads for /preview/{id} OG (Kakao crawler). Writes via Netlify function (service role); reads public (anon).

CREATE TABLE IF NOT EXISTS public.linko_temp_previews (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS linko_temp_previews_updated_at ON public.linko_temp_previews (updated_at DESC);

ALTER TABLE public.linko_temp_previews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "linko_temp_previews_select" ON public.linko_temp_previews;
CREATE POLICY "linko_temp_previews_select"
  ON public.linko_temp_previews
  FOR SELECT
  USING (true);

-- No INSERT/UPDATE policies for anon — only service role (Netlify sync-temp-preview).
