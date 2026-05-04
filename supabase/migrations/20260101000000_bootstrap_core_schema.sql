-- 빈 Supabase 프로젝트에 최초 적용 시 테이블이 없어 전체 기능이 실패하는 문제 방지.
-- 이후 20260401050000_init_core_public_tables.sql 등과 중복되어도 IF NOT EXISTS / OR REPLACE 로 안전합니다.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles (auth.users 연동 — 앱 전역에서 role 등 조회)
-- referrals 마이그레이션(20260429100000)과 충돌하지 않도록 referral_code·updated_at 포함
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  referral_code text NOT NULL DEFAULT encode(gen_random_bytes(9), 'hex'),
  role text DEFAULT 'client',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_partner boolean NOT NULL DEFAULT false
);


ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'client';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_partner boolean NOT NULL DEFAULT false;

UPDATE public.profiles
SET referral_code = encode(gen_random_bytes(9), 'hex')
WHERE referral_code IS NULL OR btrim(referral_code) = '';

ALTER TABLE public.profiles
  ALTER COLUMN referral_code SET DEFAULT encode(gen_random_bytes(9), 'hex');

ALTER TABLE public.profiles
  ALTER COLUMN referral_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_key ON public.profiles (referral_code);

-- ---------------------------------------------------------------------------
-- business_cards (앱에서 TABLE_CARDS = business_cards 로 통일)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.business_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  slug text NOT NULL UNIQUE,
  name text,
  title text,
  company text,
  description text,
  brand_name text,
  person_name text,
  job_title text,
  intro text,
  phone text,
  email text,
  image_url text,
  profile_image_url text,
  website_url text,
  blog_url text,
  youtube_url text,
  kakao_url text,
  theme text NOT NULL DEFAULT 'navy',
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  "imageUrl" text,
  brand_image_url text,
  brand_image_frame_ratio text,
  brand_image_natural_width integer,
  brand_image_natural_height integer,
  brand_image_zoom double precision,
  brand_image_pan_x double precision,
  brand_image_pan_y double precision,
  brand_image_object_position text,
  tagline text,
  "publicUrl" text,
  gallery_urls jsonb,
  services jsonb,
  trust_line text,
  trust_metric text,
  trust_testimonials jsonb,
  expire_at timestamptz,
  status text DEFAULT 'active',
  promotion_enabled boolean NOT NULL DEFAULT false,
  promotion_payment_status text NOT NULL DEFAULT 'unpaid',
  promotion_price integer NOT NULL DEFAULT 10900,
  qr_image_url text,
  design_type text DEFAULT 'simple',
  owner_id uuid,
  owner_email text,
  is_archived boolean NOT NULL DEFAULT false,
  image_status text,
  brand_image_status text,
  brand_image_pending_path text,
  brand_image_reject_reason text,
  brand_image_pending_uploaded_at timestamptz
);

CREATE INDEX IF NOT EXISTS business_cards_user_id_idx ON public.business_cards (user_id);

COMMENT ON COLUMN public.business_cards.image_status IS '레거시 별칭 — 앱은 주로 brand_image_status 사용';
COMMENT ON COLUMN public.business_cards.brand_image_status IS 'pending | approved | rejected';

-- ---------------------------------------------------------------------------
-- 레거시 코드 폴백: fetchCardBySlug 가 "cards" 조회 시 동일 데이터 사용 (뷰)
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS public.cards;
CREATE VIEW public.cards AS
  SELECT * FROM public.business_cards;

COMMENT ON VIEW public.cards IS 'business_cards 동일 뷰 — 테이블명 cards 호환용';

-- ---------------------------------------------------------------------------
-- 선택: card_images (앱에서 필수 아님, 스키마만 준비)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.card_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES public.business_cards (id) ON DELETE CASCADE,
  image_url text,
  status text DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS card_images_card_id_idx ON public.card_images (card_id);

-- ---------------------------------------------------------------------------
-- card_views (init 마이그레이션과 동일)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.card_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  referrer text,
  user_agent text,
  promoter_code text,
  source text
);

CREATE INDEX IF NOT EXISTS card_views_card_id_idx ON public.card_views (card_id);

-- ---------------------------------------------------------------------------
-- RLS (init과 동일 패턴)
-- ---------------------------------------------------------------------------
ALTER TABLE public.business_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "business_cards_select_own_or_email" ON public.business_cards;
CREATE POLICY "business_cards_select_own_or_email"
  ON public.business_cards FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "business_cards_insert_own" ON public.business_cards;
CREATE POLICY "business_cards_insert_own"
  ON public.business_cards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR auth.uid() = owner_id);

DROP POLICY IF EXISTS "business_cards_update_own_or_email" ON public.business_cards;
CREATE POLICY "business_cards_update_own_or_email"
  ON public.business_cards FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR auth.uid() = owner_id
    OR LOWER(email) = LOWER(COALESCE(auth.email(), ''))
    OR LOWER(owner_email) = LOWER(COALESCE(auth.email(), ''))
  )
  WITH CHECK (
    auth.uid() = user_id
    OR auth.uid() = owner_id
    OR LOWER(email) = LOWER(COALESCE(auth.email(), ''))
    OR LOWER(owner_email) = LOWER(COALESCE(auth.email(), ''))
  );

DROP POLICY IF EXISTS "card_views insert public" ON public.card_views;
CREATE POLICY "card_views insert public"
  ON public.card_views FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "card_views_select_auth_dev" ON public.card_views;
CREATE POLICY "card_views_select_auth_dev"
  ON public.card_views FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "card_images_select_own" ON public.card_images;
CREATE POLICY "card_images_select_own"
  ON public.card_images FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_cards b
      WHERE b.id = card_images.card_id
        AND (b.user_id = auth.uid() OR b.owner_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "card_images_modify_own" ON public.card_images;
CREATE POLICY "card_images_modify_own"
  ON public.card_images FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_cards b
      WHERE b.id = card_images.card_id
        AND (b.user_id = auth.uid() OR b.owner_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_cards b
      WHERE b.id = card_images.card_id
        AND (b.user_id = auth.uid() OR b.owner_id = auth.uid())
    )
  );

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.business_cards TO anon, authenticated;
GRANT INSERT, UPDATE ON public.business_cards TO authenticated;
GRANT SELECT ON public.cards TO anon, authenticated;
GRANT SELECT, INSERT ON public.card_views TO anon, authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.card_images TO authenticated;
