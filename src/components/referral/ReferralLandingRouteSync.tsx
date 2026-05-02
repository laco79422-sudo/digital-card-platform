import {
  extractPlatformReferralFromLocation,
  purgeLegacyReferralLocalStorageOnce,
  syncActiveReferralSessionFromNavigation,
} from "@/lib/activeReferralSession";
import { useReferralLandingRouteStore } from "@/stores/referralLandingRouteStore";
import { useLayoutEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function normalizePathname(pathname: string): string {
  const t = pathname.replace(/\/$/, "") || "/";
  return t || "/";
}

/**
 * 세션에는 `ref`를 남기고, 주소창에서만 `ref`를 제거해 일반 마케팅 유입처럼 보이게 합니다.
 * 회원가입 시 자동 추천 속성과 공개 헤더 마스킹에는 sessionStorage만 사용합니다.
 */
export function ReferralLandingRouteSync() {
  const location = useLocation();
  const navigate = useNavigate();

  useLayoutEffect(() => {
    purgeLegacyReferralLocalStorageOnce();
  }, []);

  useLayoutEffect(() => {
    syncActiveReferralSessionFromNavigation(location.pathname, location.search);
    useReferralLandingRouteStore.getState().applyLocation(location.pathname, location.search);

    const path = normalizePathname(location.pathname);
    const detected = extractPlatformReferralFromLocation(location.pathname, location.search);
    if (path !== "/" || !detected) return;

    const params = new URLSearchParams(location.search);
    if (!params.get("ref")?.trim()) return;

    params.delete("ref");
    const qs = params.toString();
    navigate({ pathname: "/", search: qs ? `?${qs}` : "" }, { replace: true });
  }, [location.pathname, location.search, navigate]);

  return null;
}
