-- Store the public card image URL under the user-facing field name requested by the app.

ALTER TABLE public.business_cards
ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

UPDATE public.business_cards
SET "imageUrl" = brand_image_url
WHERE "imageUrl" IS NULL
  AND brand_image_url IS NOT NULL;

