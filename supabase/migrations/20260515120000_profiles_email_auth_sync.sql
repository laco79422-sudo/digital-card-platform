-- profiles.email: 컬럼 추가 + 신규 가입 동기화
-- 요구사항 유지 — handle_new_user / on_auth_user_created 사용 금지
-- 트리거 on_auth_user_created_profile 은 수정·재생성하지 않음(함수만 REPLACE 시 자동 적용됨).

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

COMMENT ON COLUMN public.profiles.email IS '가입 시점 auth.users 이메일 스냅샷';

-- 신규 가입: 기존과 동일하게 referral_code(ensure_unique_referral_code) + email 저장
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, referral_code, email)
  VALUES (
    NEW.id,
    public.ensure_unique_referral_code(),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 기존 회원 중 profiles 행 없음 보정(id + referral_code + email)
INSERT INTO public.profiles (id, referral_code, email)
SELECT u.id, public.ensure_unique_referral_code(), u.email
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- 기존 회원 중 email 비어 있는 행 보정(auth.users 우선)
UPDATE public.profiles p
SET
  email = u.email,
  updated_at = now()
FROM auth.users u
WHERE p.id = u.id
  AND (p.email IS NULL OR length(trim(p.email)) = 0);
