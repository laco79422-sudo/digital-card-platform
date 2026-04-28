-- 추천 가입 추적: profiles.referral_code + referrals 테이블 + claim RPC

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_key ON public.profiles (referral_code);

CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  status text NOT NULL DEFAULT 'joined',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS referrals_referrer_user_id_idx ON public.referrals (referrer_user_id);

CREATE OR REPLACE FUNCTION public.generate_linko_referral_code()
RETURNS text
LANGUAGE sql
AS $$
  SELECT 'LINKO' || upper(substring(md5(random()::text || clock_timestamp()::text) from 3 for 8));
$$;

CREATE OR REPLACE FUNCTION public.ensure_unique_referral_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  c text;
BEGIN
  LOOP
    c := public.generate_linko_referral_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = c);
  END LOOP;
  RETURN c;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, referral_code)
  VALUES (NEW.id, public.ensure_unique_referral_code())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user_profile();

INSERT INTO public.profiles (id, referral_code)
SELECT u.id, public.ensure_unique_referral_code()
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "referrals_select_as_referrer" ON public.referrals;
CREATE POLICY "referrals_select_as_referrer"
  ON public.referrals FOR SELECT
  TO authenticated
  USING (referrer_user_id = auth.uid());

DROP POLICY IF EXISTS "referrals_select_as_referred" ON public.referrals;
CREATE POLICY "referrals_select_as_referred"
  ON public.referrals FOR SELECT
  TO authenticated
  USING (referred_user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.claim_referral(p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rid uuid;
  uid uuid := auth.uid();
  normalized text;
BEGIN
  IF uid IS NULL THEN
    RETURN false;
  END IF;
  IF p_code IS NULL OR length(trim(p_code)) < 4 THEN
    RETURN false;
  END IF;

  normalized := upper(trim(p_code));

  IF EXISTS (SELECT 1 FROM public.referrals WHERE referred_user_id = uid) THEN
    RETURN true;
  END IF;

  SELECT id INTO rid FROM public.profiles WHERE referral_code = normalized;
  IF rid IS NULL THEN
    RETURN false;
  END IF;
  IF rid = uid THEN
    RETURN false;
  END IF;

  INSERT INTO public.referrals (referrer_user_id, referred_user_id, referral_code)
  VALUES (rid, uid, normalized)
  ON CONFLICT (referred_user_id) DO NOTHING;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_referral(text) TO authenticated;
