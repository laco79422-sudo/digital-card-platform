import {
  purgeLegacyReferralLocalStorageOnce,
  syncActiveReferralSessionFromNavigation,
} from "@/lib/activeReferralSession";
import { useReferralLandingRouteStore } from "@/stores/referralLandingRouteStore";
import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/** React Router 위치를 추천 랜딩 스토어·플랫폼 세션 추천 코드와 즉시 동기화합니다. (`useLayoutEffect`로 회원가입 등 첫 페인트 전에 적용) */
export function ReferralLandingRouteSync() {
  const location = useLocation();

  useLayoutEffect(() => {
    purgeLegacyReferralLocalStorageOnce();
  }, []);

  useLayoutEffect(() => {
    syncActiveReferralSessionFromNavigation(location.pathname, location.search);
    useReferralLandingRouteStore.getState().applyLocation(location.pathname, location.search);
  }, [location.pathname, location.search]);

  return null;
}
