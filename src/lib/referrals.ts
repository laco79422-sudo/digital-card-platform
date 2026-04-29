export const REFERRAL_QUERY_PARAM = "ref";

export function buildReferralCode(userId: string): string {
  const clean = userId.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return `LINKO${clean.slice(0, 8) || "USER"}`;
}

/** 5명: 1개월, 10명: 2개월 무료 이용권 */
export function rewardMonthsForReferralCount(count: number): number {
  if (count >= 10) return 2;
  if (count >= 5) return 1;
  return 0;
}

/** 추천 링크 공유·복사용 도메인 (복사 시 localhost가 나가지 않도록 고정) */
export const LINKO_REFERRAL_PUBLIC_ORIGIN = "https://linkoapp.kr" as const;

/**
 * 추천 전용 URL — 항상 프로덕션 메인 `/?ref=` (명함 `/c/{slug}` 와 절대 섞지 않음).
 */
export function buildSignupReferralUrl(referralCode: string): string {
  const code = referralCode.trim().toUpperCase();
  return `${LINKO_REFERRAL_PUBLIC_ORIGIN}/?ref=${encodeURIComponent(code)}`;
}

export function getReferralCodeFromSearch(search: string): string | null {
  const value = new URLSearchParams(search).get(REFERRAL_QUERY_PARAM)?.trim();
  return value ? value.toUpperCase() : null;
}

