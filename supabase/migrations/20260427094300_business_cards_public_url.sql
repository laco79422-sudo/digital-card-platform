-- Store the public card URL when the app sends one.

ALTER TABLE public.business_cards
ADD COLUMN IF NOT EXISTS "publicUrl" TEXT;

