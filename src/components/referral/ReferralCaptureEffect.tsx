import { saveLinkoReferralCodeFromUrl } from "@/lib/linkoReferralStorage";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * 추천 코드 저장 (`linko_referral_code`).
 * 메인 `/`, 회원가입·로그인 경로의 `?ref=` 만 처리 — 명함 공유 `/c/{slug}` 와 분리.
 */
const REF_CAPTURE_PATH_PREFIXES = ["/signup", "/login"];

export function ReferralCaptureEffect() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname.replace(/\/$/, "") || "/";
    const allowed =
      path === "/" ||
      REF_CAPTURE_PATH_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
    if (!allowed) return;

    const ref = new URLSearchParams(location.search).get("ref");
    if (ref) saveLinkoReferralCodeFromUrl(ref);
  }, [location.pathname, location.search]);

  return null;
}
