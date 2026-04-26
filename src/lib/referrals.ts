export const REFERRAL_QUERY_PARAM = "ref";

export function buildReferralCode(userId: string): string {
  const clean = userId.replace(/[^a-z0-9]/gi, "").toUpperCase();
  return `LINKO${clean.slice(0, 8) || "USER"}`;
}

export function rewardMonthsForReferralCount(count: number): number {
  if (count >= 20) return 2;
  if (count >= 10) return 1;
  return 0;
}

export function getReferralCodeFromSearch(search: string): string | null {
  const value = new URLSearchParams(search).get(REFERRAL_QUERY_PARAM)?.trim();
  return value ? value.toUpperCase() : null;
}

