import { useReferralLandingRouteStore } from "@/stores/referralLandingRouteStore";

/**
 * URL 쿼리의 `?ref=` 는 세션 저장 후 제거되므로, 화면상으로는 대부분 null 입니다.
 * 추천 코드는 sessionStorage `referralCode` 를 사용하세요.
 */
export function useReferralLanding(): {
  referralCodeOnHome: string | null;
} {
  const normalizedPath = useReferralLandingRouteStore((s) => s.normalizedPath);
  const refFromLocation = useReferralLandingRouteStore((s) => s.refFromLocation);

  const referralCodeOnHome = normalizedPath === "/" ? refFromLocation : null;

  return { referralCodeOnHome };
}
