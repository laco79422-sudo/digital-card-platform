-- 회원 soft delete · 명함 아카이브 · 추천보상 forfeited · 탈퇴 RPC

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS deletion_reason text NULL,
  ADD COLUMN IF NOT EXISTS can_login boolean NOT NULL DEFAULT true;

ALTER TABLE public.business_cards
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz NULL;

ALTER TABLE public.referral_rewards
  ADD COLUMN IF NOT EXISTS forfeited_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS forfeited_reason text NULL;

ALTER TABLE public.referral_rewards DROP CONSTRAINT IF EXISTS referral_rewards_status_check;

ALTER TABLE public.referral_rewards ADD CONSTRAINT referral_rewards_status_check CHECK (
  status IN ('pending', 'confirmed', 'paid', 'cancelled', 'forfeited')
);

DROP POLICY IF EXISTS profiles_admin_select_all ON public.profiles;

CREATE POLICY profiles_admin_select_all ON public.profiles FOR SELECT TO authenticated USING (public.is_app_admin());

COMMENT ON COLUMN public.profiles.is_deleted IS '탈퇴(soft delete) 처리 여부';
COMMENT ON COLUMN public.profiles.can_login IS 'false 이면 앱에서 로그아웃·차단';
COMMENT ON COLUMN public.business_cards.is_archived IS '탈퇴 등으로 소유자 명함 비활성·공개 중단';

CREATE OR REPLACE FUNCTION public.soft_delete_account (
  p_reason text DEFAULT NULL,
  p_forfeit_confirmed_rewards boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;

  UPDATE public.profiles
  SET
    is_deleted = true,
    deleted_at = now(),
    deletion_reason = p_reason,
    can_login = false
  WHERE
    id = uid;

  UPDATE public.business_cards
  SET
    is_public = false,
    is_archived = true,
    archived_at = coalesce(archived_at, now())
  WHERE
    user_id = uid
    OR owner_id = uid;

  UPDATE public.referral_rewards
  SET
    status = 'forfeited',
    forfeited_at = now(),
    forfeited_reason = 'account_deleted'
  WHERE
    referrer_user_id = uid
    AND status = 'pending';

  IF p_forfeit_confirmed_rewards THEN
    UPDATE public.referral_rewards
    SET
      status = 'forfeited',
      forfeited_at = now(),
      forfeited_reason = 'account_deleted_confirmed_forfeited'
    WHERE
      referrer_user_id = uid
      AND status = 'confirmed'
      AND withdrawal_request_id IS NULL;
  END IF;

  UPDATE public.partner_commissions
  SET settlement_status = 'cancelled'
  WHERE
    partner_user_id = uid
    AND withdrawal_request_id IS NULL
    AND settlement_status = 'pending';

  IF p_forfeit_confirmed_rewards THEN
    UPDATE public.partner_commissions
    SET settlement_status = 'cancelled'
    WHERE
      partner_user_id = uid
      AND withdrawal_request_id IS NULL
      AND settlement_status = 'confirmed';
  END IF;

  UPDATE public.promotion_applications
  SET status = 'withdrawn'
  WHERE
    (
      owner_user_id = uid
      OR applicant_user_id = uid
    )
    AND status IN ('pending', 'approved');

  RETURN jsonb_build_object('ok', TRUE);
END;
$$;

GRANT EXECUTE ON FUNCTION public.soft_delete_account (text, boolean) TO authenticated;
