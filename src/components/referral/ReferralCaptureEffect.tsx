import { saveLinkoReferralCodeFromUrl } from "@/lib/linkoReferralStorage";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * 추천 코드 저장 (`linko_referral_code`).
 * 메인 `/`, 회원가입·로그인의 `?ref=` 및 잘못된 `/c/...?ref=` 진입 시에도 저장.
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
    const cardPathWithRef = path.startsWith("/c/");

    if (landing || cardPathWithRef) {
      saveLinkoReferralCodeFromUrl(ref);
    }
  }, [location.pathname, location.search]);

  return null;
}
