export const LINKO_REFERRAL_CODE_STORAGE_KEY = "linko_referral_code";

/** URL ?ref= 로 들어온 추천 코드 (회원가입·로그인 시 claim_referral 에 사용) */
export function saveLinkoReferralCodeFromUrl(ref: string): void {
  const t = ref.trim().toUpperCase();
  if (!t) return;
  try {
    localStorage.setItem(LINKO_REFERRAL_CODE_STORAGE_KEY, t);
  } catch {
    /* ignore */
  }
}

export function getStoredLinkoReferralCode(): string | null {
  try {
    const v = localStorage.getItem(LINKO_REFERRAL_CODE_STORAGE_KEY)?.trim().toUpperCase();
    return v || null;
  } catch {
    return null;
  }
}

export function clearStoredLinkoReferralCode(): void {
  try {
    localStorage.removeItem(LINKO_REFERRAL_CODE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
