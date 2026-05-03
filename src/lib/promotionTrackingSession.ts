import type { ParsedPromotionUrl } from "@/lib/cardPromoTracking";

/**
 * 헬퍼/캠페인·채널 유입 세션 상태(탭 단위).
 * 회원추천 `referralCode`(localStorage)와 별개이며 여기 값으로 플랫폼 추천 코드를 덮어쓰지 않습니다.
 */
export const SESSION_CURRENT_CHANNEL_KEY = "currentChannelId";
export const SESSION_CURRENT_HELPER_KEY = "currentHelperId";
export const SESSION_CURRENT_CAMPAIGN_KEY = "currentCampaignId";

/** 캠페인 링크의 helper 파라미터는 helperPartnerProfileId 또는 레거시 helper UUID */
export function resolvePromotionHelperSessionValue(ctx: ParsedPromotionUrl): string | null {
  return ctx.helperPartnerProfileId ?? ctx.helperId ?? null;
}

/** `/c/:slug` 프로모 컨텍스트를 세션에 동기화(비어 있는 필드는 키 제거) */
export function syncPromotionTrackingSession(ctx: ParsedPromotionUrl): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    if (ctx.channelId) sessionStorage.setItem(SESSION_CURRENT_CHANNEL_KEY, ctx.channelId);
    else sessionStorage.removeItem(SESSION_CURRENT_CHANNEL_KEY);

    if (ctx.campaignId) sessionStorage.setItem(SESSION_CURRENT_CAMPAIGN_KEY, ctx.campaignId);
    else sessionStorage.removeItem(SESSION_CURRENT_CAMPAIGN_KEY);

    const helperSid = resolvePromotionHelperSessionValue(ctx);
    if (helperSid) sessionStorage.setItem(SESSION_CURRENT_HELPER_KEY, helperSid);
    else sessionStorage.removeItem(SESSION_CURRENT_HELPER_KEY);
  } catch {
    /* quota / denied */
  }
}
