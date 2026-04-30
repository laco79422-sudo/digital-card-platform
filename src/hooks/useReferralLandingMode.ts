import { useReferralLandingRouteStore } from "@/stores/referralLandingRouteStore";

/**
 * 홈 경로의 `?ref=` 값만 노출합니다.
 * 외부 방문자 UI는 일반 메인과 동일하게 유지하므로, 추천 전용 랜딩 분기에는 사용하지 않습니다.
 */
export function useReferralLanding(): {
  referralCodeOnHome: string | null;
} {
  const normalizedPath = useReferralLandingRouteStore((s) => s.normalizedPath);
  const refFromLocation = useReferralLandingRouteStore((s) => s.refFromLocation);

  const referralCodeOnHome = normalizedPath === "/" ? refFromLocation : null;

  return { referralCodeOnHome };
}
