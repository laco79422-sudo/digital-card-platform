import { LINKO_REFERRAL_CODE_STORAGE_KEY } from "@/lib/linkoReferralStorage";

/** 플랫폼 추천인: `/?ref=` 또는 `/ref/:code`에서만 활성화 (탭 세션) */
export const ACTIVE_REFERRAL_CODE_SESSION_KEY = "activeReferralCode";

/** 한 번만: 예전에 localStorage에 남아 일반 접속에서 추천 UI가 뜨는 값 제거 */
let legacyReferralLocalStoragePurged = false;

function normalizePathname(pathname: string): string {
  const t = pathname.replace(/\/$/, "") || "/";
  return t || "/";
}

/**
 * 홈(`/`)의 `ref` 또는 `/ref/:code`에서만 플랫폼 추천 코드를 인정합니다.
 * `/signup?ref=` 등은 무시합니다.
 */
export function extractPlatformReferralFromLocation(pathname: string, search: string): string | null {
  const path = normalizePathname(pathname);
  const pathMatch = path.match(/^\/ref\/([^/]+)$/);
  const refFromPath = pathMatch?.[1]?.trim();
  if (refFromPath) return refFromPath.toUpperCase();

  const refFromQuery = new URLSearchParams(search).get("ref")?.trim();
  if (path === "/" && refFromQuery) return refFromQuery.toUpperCase();

  return null;
}

/**
 * SPA 네비게이션마다 호출합니다.
 * - 유효한 ref가 없고 **루트 `/`에서 쿼리 ref도 없을 때만** 세션 추천을 지웁니다.
 * - `/signup`, `/pricing` 등 다른 경로로 이동할 때는 세션을 유지합니다.
 */
export function syncActiveReferralSessionFromNavigation(pathname: string, search: string): void {
  if (typeof sessionStorage === "undefined") return;

  const detected = extractPlatformReferralFromLocation(pathname, search);
  const path = normalizePathname(pathname);
  const hasRefQuery = Boolean(new URLSearchParams(search).get("ref")?.trim());

  if (detected) {
    try {
      sessionStorage.setItem(ACTIVE_REFERRAL_CODE_SESSION_KEY, detected);
    } catch {
      /* ignore */
    }
    return;
  }

  if (path === "/" && !hasRefQuery) {
    try {
      sessionStorage.removeItem(ACTIVE_REFERRAL_CODE_SESSION_KEY);
    } catch {
      /* ignore */
    }
  }
}

export function getActiveReferralCode(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const v = sessionStorage.getItem(ACTIVE_REFERRAL_CODE_SESSION_KEY)?.trim().toUpperCase();
    return v || null;
  } catch {
    return null;
  }
}

/**
 * 헤더·회원가입 CTA 라벨용.
 * 깨끗한 메인(`/`, ref 쿼리 없음)에서는 세션을 보지 않아, 동기화 직후 지워지는 과거 세션 때문에
 * 「시작하기」가 깜박이지 않도록 합니다. 그 외 경로에서는 `activeReferralCode` 세션으로 추천 흐름 유지.
 */
export function hasActiveReferralSignupContext(pathname: string, search: string): boolean {
  const fromUrl = extractPlatformReferralFromLocation(pathname, search);
  if (fromUrl) return true;

  const path = normalizePathname(pathname);
  const hasRefQuery = Boolean(new URLSearchParams(search).get("ref")?.trim());

  if (path === "/" && !hasRefQuery) return false;

  return Boolean(getActiveReferralCode());
}

export function clearActiveReferralCode(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(ACTIVE_REFERRAL_CODE_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function purgeLegacyReferralLocalStorageOnce(): void {
  if (legacyReferralLocalStoragePurged || typeof localStorage === "undefined") return;
  legacyReferralLocalStoragePurged = true;
  try {
    localStorage.removeItem(LINKO_REFERRAL_CODE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
