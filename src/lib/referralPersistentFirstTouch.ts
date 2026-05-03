/**
 * 플랫폼 회원추천(?ref·/, /ref/*만): localStorage 에 최초 1회만 저장(덮어쓰기 없음).
 * • 인증 토큰·결제키·민감정보는 저장하지 않습니다.
 * • 헬퍼/캠페인 명함 ref 는 `promotionReferralStorage`(sessionStorage) — 이 모듈과 혼합하지 않습니다.
 */
const PERSISTENT_REFERRAL_KEY = "referralCode";
/** ISO 8601 — 최초 유입 시각(만료 및 감사용) */
export const REFERRAL_FIRST_SEEN_AT_KEY = "referralFirstSeenAt";

/** 추천 캡처 유지 기간(밀리초) — 30일 */
export const PLATFORM_REFERRAL_LOCAL_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

function normalize(raw: string): string {
  return raw.trim().toUpperCase();
}

/** 만료·손상 시 localStorage 플랫폼 추천 필드 제거. 만료 등으로 코드를 삭제했다면 true. */
export function pruneExpiredPersistentPlatformReferralCapture(): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    const rawCode = localStorage.getItem(PERSISTENT_REFERRAL_KEY)?.trim();
    const seenRaw = localStorage.getItem(REFERRAL_FIRST_SEEN_AT_KEY)?.trim();

    if (!rawCode || normalize(rawCode).length < 4) {
      localStorage.removeItem(PERSISTENT_REFERRAL_KEY);
      if (seenRaw) localStorage.removeItem(REFERRAL_FIRST_SEEN_AT_KEY);
      return false;
    }

    let seenIso = seenRaw ?? "";
    if (!seenIso) {
      seenIso = new Date().toISOString();
      localStorage.setItem(REFERRAL_FIRST_SEEN_AT_KEY, seenIso);
      return false;
    }

    const created = Date.parse(seenIso);
    if (Number.isNaN(created)) {
      seenIso = new Date().toISOString();
      localStorage.setItem(REFERRAL_FIRST_SEEN_AT_KEY, seenIso);
      return false;
    }

    if (Date.now() - created > PLATFORM_REFERRAL_LOCAL_MAX_AGE_MS) {
      localStorage.removeItem(PERSISTENT_REFERRAL_KEY);
      localStorage.removeItem(REFERRAL_FIRST_SEEN_AT_KEY);
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * URL 에 유효한 플랫폼 추천이 있을 때만 호출(일반 홈 접속에서는 호출 금지).
 * 기존 키가 있으면 절대 덮어쓰지 않습니다.
 */
export function tryPersistFirstTouchPlatformReferral(rawUpperOrMixed: string): void {
  const code = normalize(rawUpperOrMixed ?? "");
  if (code.length < 4 || typeof localStorage === "undefined") return;

  try {
    pruneExpiredPersistentPlatformReferralCapture();

    if (localStorage.getItem(PERSISTENT_REFERRAL_KEY)) return;

    const now = new Date().toISOString();
    localStorage.setItem(PERSISTENT_REFERRAL_KEY, code);
    localStorage.setItem(REFERRAL_FIRST_SEEN_AT_KEY, now);
  } catch {
    /* quota / privacy mode */
  }
}

export function getPersistentPlatformReferralCode(): string | null {
  if (typeof localStorage === "undefined") return null;
  try {
    pruneExpiredPersistentPlatformReferralCapture();
    const v = localStorage.getItem(PERSISTENT_REFERRAL_KEY)?.trim();
    const u = v ? normalize(v) : "";
    return u.length >= 4 ? u : null;
  } catch {
    return null;
  }
}

/** 서버 반영 후 브라우저 캡처 제거 */
export function clearPersistentPlatformReferralCapture(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(PERSISTENT_REFERRAL_KEY);
    localStorage.removeItem(REFERRAL_FIRST_SEEN_AT_KEY);
  } catch {
    /* ignore */
  }
}
