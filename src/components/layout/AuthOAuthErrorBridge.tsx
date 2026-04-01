import { consumeAuthRedirectError } from "@/lib/auth/authRedirectError";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * OAuth 실패 시 Supabase가 `redirectTo` URL에 붙인 `#error=...` 를 읽어 로그인 화면으로 넘깁니다.
 * (대시보드로 돌아온 뒤에도 사용자가 메시지를 볼 수 있게 함)
 */
export function AuthOAuthErrorBridge() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const h = window.location.hash;
    if (!h || !h.includes("error")) return;
    const msg = consumeAuthRedirectError();
    if (!msg) return;
    navigate("/login", { replace: true, state: { oauthError: msg } });
  }, [pathname, navigate]);

  return null;
}
