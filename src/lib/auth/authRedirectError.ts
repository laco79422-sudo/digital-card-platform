import { authErrorToKorean } from "@/lib/auth/authErrorMessage";

/**
 * OAuth/PKCE 실패 시 리다이렉트 URL의 hash/query에 붙는 error를 읽고 주소창에서 제거합니다.
 * 예: #error=...&error_code=identity_already_exists&error_description=...
 */
export function consumeAuthRedirectError(): string | null {
  if (typeof window === "undefined") return null;

  const { pathname, search, hash } = window.location;
  let error: string | null = null;
  let description: string | null = null;
  let code: string | null = null;

  if (hash && hash.length > 1) {
    const hp = new URLSearchParams(hash.slice(1));
    error = hp.get("error");
    description = hp.get("error_description");
    code = hp.get("error_code");
  }

  if (!error && !description) {
    const sp = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
    error = sp.get("error");
    description = sp.get("error_description");
    code = code ?? sp.get("error_code");
  }

  if (!error && !description) return null;

  const raw = description || error || "";
  const decoded = raw
    ? decodeURIComponent(raw.replace(/\+/g, " "))
    : "";

  const cleanSearch = stripAuthErrorParams(search);
  window.history.replaceState(null, "", pathname + cleanSearch);

  return authErrorToKorean(decoded, code ?? undefined);
}

function stripAuthErrorParams(search: string): string {
  if (!search || search === "?") return "";
  const q = search.startsWith("?") ? search.slice(1) : search;
  const sp = new URLSearchParams(q);
  ["error", "error_description", "error_code"].forEach((k) => sp.delete(k));
  const next = sp.toString();
  return next ? `?${next}` : "";
}
