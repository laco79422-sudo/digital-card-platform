-- Public image bucket for digital card hero images.
-- Apply this in Supabase before using card image uploads.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'card-images',
  'card-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

DROP POLICY IF EXISTS "card_images_select_public" ON storage.objects;
CREATE POLICY "card_images_select_public"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'card-images');

DROP POLICY IF EXISTS "card_images_insert_public" ON storage.objects;
CREATE POLICY "card_images_insert_public"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'card-images');

DROP POLICY IF EXISTS "card_images_update_public" ON storage.objects;
CREATE POLICY "card_images_update_public"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'card-images')
  WITH CHECK (bucket_id = 'card-images');

