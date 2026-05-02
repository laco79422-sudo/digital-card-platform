import { extractPlatformReferralFromLocation } from "@/lib/activeReferralSession";
import { maybeRecordReferralLinkVisit } from "@/lib/referralClickTracking";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * `/?ref=` · `/ref/:code`(→ 리다이렉트 후 `/?ref=` ) 유입에 대해 `referral_link_visits`를 기록합니다.
 * 활성 세션 추천 코드는 ReferralLandingRouteSync에서 처리합니다.
 */
export function ReferralCaptureEffect() {
  const location = useLocation();

  useEffect(() => {
    const ref = extractPlatformReferralFromLocation(location.pathname, location.search)?.trim();
    if (!ref) return;
    const landingPath = `${location.pathname}${location.search}`;
    void maybeRecordReferralLinkVisit(ref, landingPath);
  }, [location.pathname, location.search]);

  return null;
}
