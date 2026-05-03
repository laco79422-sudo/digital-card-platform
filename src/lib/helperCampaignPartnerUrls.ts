import { isPromotionUuid } from "@/lib/cardPromoTracking";
import { canonicalSiteOrigin } from "@/lib/siteOrigin";

/** 스펙: /c/{slug}?campaign=&channel=&helper=partnerProfileId&type=helper */
export function buildCampaignPartnerShareUrl(opts: {
  slug: string;
  campaignId: string;
  channelId?: string | null;
  partnerProfileId: string;
  origin?: string;
}): string {
  const origin = (opts.origin ?? canonicalSiteOrigin()).replace(/\/$/, "");
  const u = new URL(`${origin}/c/${encodeURIComponent(opts.slug.trim())}`);
  if (isPromotionUuid(opts.campaignId)) u.searchParams.set("campaign", opts.campaignId.trim());
  if (opts.channelId?.trim() && isPromotionUuid(opts.channelId)) u.searchParams.set("channel", opts.channelId.trim());
  u.searchParams.set("type", "helper");
  if (isPromotionUuid(opts.partnerProfileId)) u.searchParams.set("helper", opts.partnerProfileId.trim());
  return u.toString();
}

export const HELPER_PROMO_CHANNELS = [
  { id: "kakao", label: "카카오톡" },
  { id: "daangn", label: "당근" },
  { id: "blog", label: "블로그" },
  { id: "youtube", label: "유튜브" },
  { id: "instagram", label: "인스타그램" },
  { id: "community", label: "지역 커뮤니티" },
  { id: "other", label: "기타" },
] as const;

export const HELPER_PROMO_GOALS = [
  { id: "views", label: "조회 늘리기" },
  { id: "inquiries", label: "문의 늘리기" },
  { id: "consult", label: "상담 연결" },
  { id: "booking", label: "결제/예약 유도" },
] as const;
