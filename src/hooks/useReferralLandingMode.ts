import { useLocation } from "react-router-dom";

/**
 * 메인 `/` 에서 `?ref=` 가 있으면 추천 전용 랜딩.
 * 로그인 여부와 관계없이 동일하게 적용 (테스트·공유 시 혼선 방지).
 */
export function useReferralLandingMode(): boolean {
  const { pathname, search } = useLocation();
  const path = pathname.replace(/\/$/, "") || "/";
  if (path !== "/") return false;
  const ref = new URLSearchParams(search).get("ref")?.trim();
  return Boolean(ref);
}
