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

/** 추천 가입용 URL — 명함 공유 링크(/c/...)와 분리 */
export function buildSignupReferralUrl(siteOrigin: string, referralCode: string): string {
  const o = siteOrigin.replace(/\/$/, "");
  const code = referralCode.trim().toUpperCase();
  return `${o}/signup?ref=${encodeURIComponent(code)}`;
}

export function getReferralCodeFromSearch(search: string): string | null {
  const value = new URLSearchParams(search).get(REFERRAL_QUERY_PARAM)?.trim();
  return value ? value.toUpperCase() : null;
}

