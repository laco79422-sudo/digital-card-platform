import { LINKO_REFERRAL_CODE_STORAGE_KEY } from "@/lib/linkoReferralStorage";

/** 플랫폼 추천 코드 — 세션 전용(localStorage 미사용), 탭 닫으면 삭제됨 */
export const REFERRAL_CODE_SESSION_KEY = "referralCode";
/**
 * 추천 경로로 유입된 탭에서 공개 상단바(로그인/회원가입)만 보이게 할 때.
 * {@link REFERRAL_CODE_SESSION_KEY}와 함께 설정·해제합니다.
 */
export const REFERRAL_PUBLIC_NAVBAR_SESSION_KEY = "referralVisitorPublicNavbar";
/** 과거 버전 호환용; 읽기·삭제 시 함께 처리 */
const LEGACY_REFERRAL_CODE_SESSION_KEY = "activeReferralCode";
/** @deprecated {@link REFERRAL_CODE_SESSION_KEY} 사용 */
export const ACTIVE_REFERRAL_CODE_SESSION_KEY = REFERRAL_CODE_SESSION_KEY;

/** 한 번만: 예전에 localStorage에 남아 일반 접속에서 추천 UI가 뜨는 값 제거 */
let legacyReferralLocalStoragePurged = false;

function normalizePathname(pathname: string): string {
  const t = pathname.replace(/\/$/, "") || "/";
  return t || "/";
}

function pathnameIsGuestReferralPreview(pathname: string): boolean {
  return normalizePathname(pathname) === "/preview";
}

function readRawReferralCodeFromSession(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const primary = sessionStorage.getItem(REFERRAL_CODE_SESSION_KEY)?.trim().toUpperCase();
    if (primary) return primary;
    const legacy = sessionStorage.getItem(LEGACY_REFERRAL_CODE_SESSION_KEY)?.trim().toUpperCase();
    return legacy || null;
  } catch {
    return null;
  }
}

function persistReferralCodeInSession(normalizedUpperCode: string): void {
  if (typeof sessionStorage === "undefined") return;
  const code = normalizedUpperCode.trim().toUpperCase();
  try {
    sessionStorage.setItem(REFERRAL_CODE_SESSION_KEY, code);
    sessionStorage.removeItem(LEGACY_REFERRAL_CODE_SESSION_KEY);
    sessionStorage.setItem(REFERRAL_PUBLIC_NAVBAR_SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
}

/**
 * 홈(`/`)의 `ref` 또는 `/ref/:code`에서만 플랫폼 추천 코드를 인정합니다.
 * `/signup?ref=` 등은 무시합니다.
 */
export function extractPlatformReferralFromLocation(pathname: string, search: string): string | null {
  const path = normalizePathname(pathname);
  const pathMatch = path.match(/^\/(?:ref|r)\/([^/]+)$/);
  const refFromPath = pathMatch?.[1]?.trim();
  if (refFromPath) return refFromPath.toUpperCase();

  const refFromQuery = new URLSearchParams(search).get("ref")?.trim();
  if (path === "/" && refFromQuery) return refFromQuery.toUpperCase();

  return null;
}

/**
 * SPA 네비게이션마다 호출합니다.
 * 세션 추천 코드는 브라우저 탭이 닫힐 때까지 유지합니다(직접 `linkoapp.kr/`를 연 새 탭에는 비어 있음).
 * 주소줄에서는 `ReferralLandingRouteSync`가 `ref`만 제거하므로, 여기서는 깨끗한 `/`만으로 세션을 지우지 않습니다.
 */
export function syncActiveReferralSessionFromNavigation(pathname: string, search: string): void {
  if (typeof sessionStorage === "undefined") return;
  const path = normalizePathname(pathname);
  if (pathnameIsGuestReferralPreview(path)) return;

  const detected = extractPlatformReferralFromLocation(pathname, search);

  if (detected) {
    persistReferralCodeInSession(detected);
    return;
  }

  try {
    if (readRawReferralCodeFromSession() && sessionStorage.getItem(REFERRAL_PUBLIC_NAVBAR_SESSION_KEY) !== "1") {
      sessionStorage.setItem(REFERRAL_PUBLIC_NAVBAR_SESSION_KEY, "1");
    }
  } catch {
    /* ignore */
  }
}

export function getActiveReferralCode(): string | null {
  return readRawReferralCodeFromSession();
}

export function clearActiveReferralCode(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(REFERRAL_CODE_SESSION_KEY);
    sessionStorage.removeItem(LEGACY_REFERRAL_CODE_SESSION_KEY);
    sessionStorage.removeItem(REFERRAL_PUBLIC_NAVBAR_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * 내 공간·로그아웃을 숨기고 공개 상단바만 쓸지 (로그인 세션이 있어도).
 * - `/preview`, `/?ref=…` 직접 유입
 * - 유효한 추천 코드가 세션에 있을 때: 마케팅·공개 경로에서만 유지 (대시보드·명함 편집 등은 제외)
 */
export function shouldNavbarMaskLoggedInChrome(pathname: string, search: string): boolean {
  const path = normalizePathname(pathname);
  if (pathnameIsGuestReferralPreview(path)) return true;

  const hasRefOnHome = path === "/" && Boolean(new URLSearchParams(search).get("ref")?.trim());
  if (hasRefOnHome) return true;

  try {
    if (typeof sessionStorage === "undefined" || sessionStorage.getItem(REFERRAL_PUBLIC_NAVBAR_SESSION_KEY) !== "1") {
      return false;
    }
  } catch {
    return false;
  }

  return pathnameAllowsReferralGuestNavbar(pathname);
}

/** 명함 편집·대시보드 등에서는 실제 로그인 상태를 헤더에 반영해야 합니다. */
function pathnameAllowsReferralGuestNavbar(pathname: string): boolean {
  const p = normalizePathname(pathname);
  if (p.startsWith("/cards")) return false;
  if (p === "/dashboard") return false;
  if (p.startsWith("/admin")) return false;
  if (p.startsWith("/partner/")) return false;
  if (p.startsWith("/applications")) return false;
  if (p.startsWith("/designer/")) return false;
  if (p.startsWith("/ads/")) return false;
  if (p.startsWith("/pay/")) return false;
  if (p.startsWith("/nfc/")) return false;
  if (p.startsWith("/c/")) return false;
  if (p === "/create-card") return false;
  if (p === "/requests/new" || p.startsWith("/requests/new/")) return false;
  if (p.startsWith("/edit/")) return false;
  if (p.startsWith("/preview/")) return false;
  return true;
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
