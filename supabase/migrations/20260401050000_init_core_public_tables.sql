-- 빈 DB 첫 배포 시 business_cards · card_views 가 없어 PostgREST 404 가 반복되는 경우용 부트스트랩.
-- promotion_applications, design_requests, card_visit_logs 등은 번호가 더 큰 마이그레이션에서 생성합니다.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
  owner_email text
);

CREATE INDEX IF NOT EXISTS business_cards_user_id_idx ON public.business_cards (user_id);

COMMENT ON TABLE public.business_cards IS '디지털 명함 — 코드 및 REST 테이블명은 business_cards 로 통일';

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

ALTER TABLE public.business_cards ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE public.card_views ENABLE ROW LEVEL SECURITY;

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

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.business_cards TO anon, authenticated;
GRANT INSERT, UPDATE ON public.business_cards TO authenticated;
GRANT SELECT, INSERT ON public.card_views TO anon, authenticated;
