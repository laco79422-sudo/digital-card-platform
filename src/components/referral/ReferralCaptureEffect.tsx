import { maybeRecordReferralClickFromUrl } from "@/lib/referralClickTracking";
import { saveLinkoReferralCodeFromUrl } from "@/lib/linkoReferralStorage";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * 추천 코드 저장 (`linko_referral_code`).
 * 홈 `/`, 회원가입·로그인 등 정식 추천 진입 경로에서만 저장합니다.
 * 명함 공개 URL(`/c/...`)의 `?ref=`는 추천 초대 링크가 아니므로 저장하지 않습니다.
 */
const REF_CAPTURE_PATH_PREFIXES = ["/signup", "/login"];

export function ReferralCaptureEffect() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname.replace(/\/$/, "") || "/";
    const ref = new URLSearchParams(location.search).get("ref");
    if (!ref?.trim()) return;

    const landing =
      path === "/" ||
      REF_CAPTURE_PATH_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));

    if (landing) {
      saveLinkoReferralCodeFromUrl(ref);
      void maybeRecordReferralClickFromUrl(ref);
    }
  }, [location.pathname, location.search]);

  return null;
}
