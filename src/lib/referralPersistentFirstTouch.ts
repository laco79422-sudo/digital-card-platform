/**
 * 플랫폼 회원추천(?ref·/ref/*): 브라우저에 최초 1회만 저장, 이후 값이 있으면 절대 덮어쓰지 않습니다.
 * sessionStorage 의 보조값과 분리되어 탭 간에도 같은 추천을 유지합니다.
 * 헬퍼·캠페인 명함 프로모 코드는 {@link promotionReferralStorage} 를 쓰고 여기에는 넣지 않습니다.
 */
const PERSISTENT_REFERRAL_KEY = "referralCode";

function normalize(raw: string): string {
  return raw.trim().toUpperCase();
}

export function tryPersistFirstTouchPlatformReferral(rawUpperOrMixed: string): void {
  const code = normalize(rawUpperOrMixed ?? "");
  if (code.length < 4 || typeof localStorage === "undefined") return;
  try {
    if (localStorage.getItem(PERSISTENT_REFERRAL_KEY)) return;
    localStorage.setItem(PERSISTENT_REFERRAL_KEY, code);
  } catch {
    /* quota / privacy mode */
  }
}

export function getPersistentPlatformReferralCode(): string | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const v = localStorage.getItem(PERSISTENT_REFERRAL_KEY)?.trim();
    const u = v ? normalize(v) : "";
    return u.length >= 4 ? u : null;
  } catch {
    return null;
  }
}

/** 서버 반영 후 브라우저에 남긴 플랫폼 추천 캡처를 제거(공유 PC 등) */
export function clearPersistentPlatformReferralCapture(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(PERSISTENT_REFERRAL_KEY);
  } catch {
    /* ignore */
  }
}
