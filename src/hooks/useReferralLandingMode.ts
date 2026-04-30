import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";

/** 추천 코드 저장용 (가입 등 후속 화면에서 활용 가능) */
export const LINKO_REFERRAL_CODE_STORAGE_KEY = "linko_referral_code";

/**
 * 메인 `/` 에서 `?ref=` 가 있으면 추천 전용 랜딩.
 * 로그인 여부와 관계없이 동일하게 적용합니다.
 */
export function useReferralLanding(): {
  isReferralLanding: boolean;
  referralCode: string | null;
} {
  const { pathname, search } = useLocation();
  const path = pathname.replace(/\/$/, "") || "/";

  const referralCode = useMemo(() => {
    if (path !== "/") return null;
    const raw = new URLSearchParams(search).get("ref");
    const trimmed = raw?.trim();
    return trimmed || null;
  }, [path, search]);

  const isReferralLanding = Boolean(referralCode);

  useEffect(() => {
    if (referralCode) {
      try {
        localStorage.setItem(LINKO_REFERRAL_CODE_STORAGE_KEY, referralCode);
      } catch {
        /* ignore quota / private mode */
      }
    }
  }, [referralCode]);

  return { isReferralLanding, referralCode };
}

export function useReferralLandingMode(): boolean {
  const { isReferralLanding } = useReferralLanding();
  return isReferralLanding;
}
