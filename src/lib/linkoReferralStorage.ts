export const LINKO_REFERRAL_CODE_STORAGE_KEY = "linko_referral_code";

/**
 * @deprecated 플랫폼 추천 코드는 세션만 사용합니다. 호환을 위해 빈 함수로 두었습니다.
 */
export function saveLinkoReferralCodeFromUrl(_ref: string): void {}

/** @deprecated 로컬 스토리지에서 추천 코드를 읽지 않습니다. {@link getActiveReferralCode}를 사용하세요. */
export function getStoredLinkoReferralCode(): string | null {
  return null;
}

export function clearStoredLinkoReferralCode(): void {
  try {
    localStorage.removeItem(LINKO_REFERRAL_CODE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
