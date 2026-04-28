ALTER TABLE public.business_cards
ADD COLUMN IF NOT EXISTS owner_id UUID,
ADD COLUMN IF NOT EXISTS owner_email TEXT;

UPDATE public.business_cards
SET owner_email = email
WHERE owner_email IS NULL
  AND email IS NOT NULL;

UPDATE public.business_cards
SET owner_id = user_id::uuid
WHERE owner_id IS NULL
  AND user_id IS NOT NULL
  AND user_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

CREATE INDEX IF NOT EXISTS business_cards_owner_id_idx ON public.business_cards (owner_id);
CREATE INDEX IF NOT EXISTS business_cards_owner_email_idx ON public.business_cards (LOWER(owner_email));
CREATE INDEX IF NOT EXISTS business_cards_email_idx ON public.business_cards (LOWER(email));

ALTER TABLE public.business_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "business_cards_select_own_or_email" ON public.business_cards;
CREATE POLICY "business_cards_select_own_or_email"
  ON public.business_cards
  FOR SELECT
  USING (
    user_id::text = auth.uid()::text
    OR owner_id = auth.uid()
    OR LOWER(owner_email) = LOWER(auth.email())
    OR LOWER(email) = LOWER(auth.email())
    OR is_public = true
  );

DROP POLICY IF EXISTS "business_cards_update_own_or_email" ON public.business_cards;
CREATE POLICY "business_cards_update_own_or_email"
  ON public.business_cards
  FOR UPDATE
  USING (
    user_id::text = auth.uid()::text
    OR owner_id = auth.uid()
    OR LOWER(owner_email) = LOWER(auth.email())
    OR LOWER(email) = LOWER(auth.email())
  )
  WITH CHECK (
    user_id::text = auth.uid()::text
    OR owner_id = auth.uid()
    OR LOWER(owner_email) = LOWER(auth.email())
    OR LOWER(email) = LOWER(auth.email())
  );

DROP POLICY IF EXISTS "business_cards_insert_own" ON public.business_cards;
CREATE POLICY "business_cards_insert_own"
  ON public.business_cards
  FOR INSERT
  WITH CHECK (
    user_id::text = auth.uid()::text
    OR owner_id = auth.uid()
    OR LOWER(owner_email) = LOWER(auth.email())
  );
