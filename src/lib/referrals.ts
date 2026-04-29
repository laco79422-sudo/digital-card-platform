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

/**
 * 추천 전용 URL — 메인(소개)으로 보낸 뒤 가입으로 이어지게 함.
 * 명함 공유 링크(`/c/{slug}`)와 절대 섞지 않음.
 */
export function buildSignupReferralUrl(siteOrigin: string, referralCode: string): string {
  const o = siteOrigin.replace(/\/$/, "");
  const code = referralCode.trim().toUpperCase();
  return `${o}/?ref=${encodeURIComponent(code)}`;
}

export function getReferralCodeFromSearch(search: string): string | null {
  const value = new URLSearchParams(search).get(REFERRAL_QUERY_PARAM)?.trim();
  return value ? value.toUpperCase() : null;
}

