import { saveLinkoReferralCodeFromUrl } from "@/lib/linkoReferralStorage";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** 서비스 가입 추적용 `?ref=` 만 저장 (명함 /c/?ref 홍보와 분리) */
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
