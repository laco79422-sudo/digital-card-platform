import { useReferralLandingRouteStore } from "@/stores/referralLandingRouteStore";
import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/** React Router 위치를 추천 랜딩 판별 스토어와 즉시 동기화 (첫 페인트는 스토어 초기값이 window 기준) */
export function ReferralLandingRouteSync() {
  const location = useLocation();

  useLayoutEffect(() => {
    useReferralLandingRouteStore.getState().applyLocation(location.pathname, location.search);
  }, [location.pathname, location.search]);

  return null;
}
