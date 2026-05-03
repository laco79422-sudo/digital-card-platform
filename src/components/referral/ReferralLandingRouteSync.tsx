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
 * 주소줄에서는 `ref`만 제거해 일반 마케팅 유입처럼 보이게 하고,
 * 회원추천 플랫폼 코드는 브라우저 최초 저장(localStorage)과 세션(sessionStorage)에 동기화됩니다.
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
