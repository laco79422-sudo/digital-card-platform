-- Replace permissive card-images write policies with authenticated-only writes.
-- Public bucket URLs remain readable via SELECT for anon + authenticated.
-- Apply after 20260426161000_card_images_storage.sql

DROP POLICY IF EXISTS "card_images_insert_public" ON storage.objects;
DROP POLICY IF EXISTS "card_images_update_public" ON storage.objects;

DROP POLICY IF EXISTS "card_images_insert_authenticated" ON storage.objects;
CREATE POLICY "card_images_insert_authenticated"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'card-images');

DROP POLICY IF EXISTS "card_images_update_authenticated" ON storage.objects;
CREATE POLICY "card_images_update_authenticated"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'card-images')
  WITH CHECK (bucket_id = 'card-images');

DROP POLICY IF EXISTS "card_images_delete_authenticated" ON storage.objects;
CREATE POLICY "card_images_delete_authenticated"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'card-images');
