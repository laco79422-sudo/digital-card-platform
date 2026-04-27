const PROMOTION_REF_KEY = "linko_promotion_ref_code";

export function savePromotionReferralCode(refCode: string): void {
  const clean = refCode.trim().toUpperCase();
  if (!clean) return;
  try {
    sessionStorage.setItem(PROMOTION_REF_KEY, clean);
  } catch {
    /* ignore */
  }
}

export function getPromotionReferralCode(): string | null {
  try {
    const value = sessionStorage.getItem(PROMOTION_REF_KEY)?.trim().toUpperCase();
    return value || null;
  } catch {
    return null;
  }
}

