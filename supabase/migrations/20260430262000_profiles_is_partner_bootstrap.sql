-- 파트너 마이그레이션 미적용 환경에서 profiles.is_partner 조회 오류 방지

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_partner boolean NOT NULL DEFAULT false;
