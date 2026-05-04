-- 브랜드 이미지 검수: DB 컬럼, 일일 업로드 제한, private pending 버킷, 관리자 정책

-- ---------------------------------------------------------------------------
-- business_cards: 검수 상태 및 대기 경로
-- ---------------------------------------------------------------------------
ALTER TABLE public.business_cards
  ADD COLUMN IF NOT EXISTS brand_image_status text,
  ADD COLUMN IF NOT EXISTS brand_image_pending_path text,
  ADD COLUMN IF NOT EXISTS brand_image_reject_reason text,
  ADD COLUMN IF NOT EXISTS brand_image_pending_uploaded_at timestamptz;

ALTER TABLE public.business_cards
  DROP CONSTRAINT IF EXISTS business_cards_brand_image_status_check;

ALTER TABLE public.business_cards
  ADD CONSTRAINT business_cards_brand_image_status_check CHECK (
    brand_image_status IS NULL OR brand_image_status IN ('pending', 'approved', 'rejected')
  );

COMMENT ON COLUMN public.business_cards.brand_image_status IS '히어로 이미지 검수 상태. NULL=레거시(승인된 것으로 간주)';
COMMENT ON COLUMN public.business_cards.brand_image_pending_path IS 'card-image-pending 버킷 내 객체 경로 (userId/cardId/file.ext)';
COMMENT ON COLUMN public.business_cards.brand_image_reject_reason IS '거절 시 사유';

-- 레거시(이미지가 있으면 공개에 표시되던 행): 승인으로 간주
UPDATE public.business_cards
SET brand_image_status = 'approved'
WHERE brand_image_status IS NULL
  AND (
    coalesce(nullif(trim(image_url), ''), nullif(trim(brand_image_url), ''), nullif(trim("imageUrl"), '')) IS NOT NULL
  );

-- ---------------------------------------------------------------------------
-- 일일 업로드 횟수 (UTC 기준, 사용자당 5회)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.brand_image_upload_daily (
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  upload_day date NOT NULL,
  upload_count integer NOT NULL DEFAULT 0 CHECK (upload_count >= 0 AND upload_count <= 5),
  PRIMARY KEY (user_id, upload_day)
);

CREATE INDEX IF NOT EXISTS brand_image_upload_daily_day_idx ON public.brand_image_upload_daily (upload_day);

ALTER TABLE public.brand_image_upload_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "brand_image_upload_daily_select_own" ON public.brand_image_upload_daily;
CREATE POLICY "brand_image_upload_daily_select_own"
  ON public.brand_image_upload_daily FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "brand_image_upload_daily_admin" ON public.brand_image_upload_daily;
CREATE POLICY "brand_image_upload_daily_admin"
  ON public.brand_image_upload_daily FOR SELECT TO authenticated
  USING (public.is_app_admin());

GRANT SELECT ON public.brand_image_upload_daily TO authenticated;

-- 성공 시 true, 일일 한도 초과 시 false
CREATE OR REPLACE FUNCTION public.try_consume_brand_image_upload_slot()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  today date := (timezone('utc', now()))::date;
  cur int;
BEGIN
  IF uid IS NULL THEN
    RETURN false;
  END IF;

  SELECT upload_count INTO cur
  FROM public.brand_image_upload_daily
  WHERE user_id = uid AND upload_day = today
  FOR UPDATE;

  IF FOUND THEN
    IF cur >= 5 THEN
      RETURN false;
    END IF;
    UPDATE public.brand_image_upload_daily
    SET upload_count = upload_count + 1
    WHERE user_id = uid AND upload_day = today;
  ELSE
    INSERT INTO public.brand_image_upload_daily (user_id, upload_day, upload_count)
    VALUES (uid, today, 1);
  END IF;
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.try_consume_brand_image_upload_slot() TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS: 관리자 전체 명함 조회·수정 (검수)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "business_cards_select_admin" ON public.business_cards;
CREATE POLICY "business_cards_select_admin"
  ON public.business_cards FOR SELECT TO authenticated
  USING (public.is_app_admin());

DROP POLICY IF EXISTS "business_cards_update_admin" ON public.business_cards;
CREATE POLICY "business_cards_update_admin"
  ON public.business_cards FOR UPDATE TO authenticated
  USING (public.is_app_admin())
  WITH CHECK (public.is_app_admin());

-- ---------------------------------------------------------------------------
-- Storage: private pending bucket
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'card-image-pending',
  'card-image-pending',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[];

DROP POLICY IF EXISTS "card_image_pending_insert_own" ON storage.objects;
CREATE POLICY "card_image_pending_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'card-image-pending'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "card_image_pending_select_own" ON storage.objects;
CREATE POLICY "card_image_pending_select_own"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'card-image-pending'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "card_image_pending_update_own" ON storage.objects;
CREATE POLICY "card_image_pending_update_own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'card-image-pending'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'card-image-pending'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "card_image_pending_delete_own" ON storage.objects;
CREATE POLICY "card_image_pending_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'card-image-pending'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "card_image_pending_select_admin" ON storage.objects;
CREATE POLICY "card_image_pending_select_admin"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'card-image-pending' AND public.is_app_admin());

DROP POLICY IF EXISTS "card_image_pending_delete_admin" ON storage.objects;
CREATE POLICY "card_image_pending_delete_admin"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'card-image-pending' AND public.is_app_admin());
