import type { Subscription } from "@/types/domain";

/** 앱 명칭 통일: 무료 / 스타터 / 프로 — 구독·결제 레코드에서 추정 */
export type CardPromotionPlanTier = "free" | "starter" | "pro";

export function subscriptionsAllowActive(s: Subscription): boolean {
  const st = (s.status ?? "").toLowerCase();
  return st === "active" || st === "" || st === "trialing";
}

export function cardPromotionTierFromSubscriptions(subscriptions: Subscription[]): CardPromotionPlanTier {
  const active = subscriptions.filter(subscriptionsAllowActive);
  if (active.length === 0) return "free";

  const names = active.map((s) => `${s.plan_name}`.trim().toLowerCase());
  if (names.some((n) => n.includes("프로") || n.includes("pro"))) return "pro";
  if (
    names.some(
      (n) => n.includes("스타터") || n.includes("starter") || n.includes("basic") || n.includes("링크"),
    )
  ) {
    return "starter";
  }
  return "free";
}

/** 명함 하나당 허용 유료 채널 개수 상한 — 스펙 스타터 3개, 무료 0·프로 무제한 */
export function effectiveChannelCap(tier: CardPromotionPlanTier): number {
  if (tier === "free") return 0;
  if (tier === "starter") return 3;
  return Number.POSITIVE_INFINITY;
}

export function canManagePromoHelpers(tier: CardPromotionPlanTier): boolean {
  return tier === "pro";
}
