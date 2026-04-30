import { LINKO_REFERRAL_CODE_STORAGE_KEY } from "@/lib/linkoReferralStorage";
import { useReferralLandingRouteStore } from "@/stores/referralLandingRouteStore";
import { useEffect } from "react";

/**
 * 메인 `/` 에서 `?ref=` 가 있으면 추천 전용 랜딩.
 * 로그인 여부와 관계없이 동일하게 적용합니다.
 *
 * 첫 페인트부터 올바르게 보이도록 경로·쿼리는 `referralLandingRouteStore`에서 읽습니다.
 * (React Router `location`만 쓰면 초기 렌더에서 쿼리가 비어 헤더가 잘못 나올 수 있음)
 */
export function useReferralLanding(): {
  isReferralLanding: boolean;
  referralCode: string | null;
} {
  const normalizedPath = useReferralLandingRouteStore((s) => s.normalizedPath);
  const refFromLocation = useReferralLandingRouteStore((s) => s.refFromLocation);

  const referralCode = normalizedPath === "/" ? refFromLocation : null;
  const isReferralLanding = Boolean(referralCode);

  useEffect(() => {
    if (referralCode) {
      try {
        localStorage.setItem(LINKO_REFERRAL_CODE_STORAGE_KEY, referralCode.trim().toUpperCase());
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
