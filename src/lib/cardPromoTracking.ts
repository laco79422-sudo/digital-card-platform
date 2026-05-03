import { canonicalSiteOrigin } from "@/lib/siteOrigin";
import type { CardLink } from "@/types/domain";
import type { PromoShareType, CardPromoEventType } from "@/types/cardPromo";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isPromotionUuid(raw: string | null | undefined): boolean {
  if (!raw?.trim()) return false;
  return UUID_RE.test(raw.trim());
}

/** 공개 명함 `/c/{slug}` + 채널·헬퍼 추적 파라미터 */
export function buildPromotionCardUrl(opts: {
  slug: string;
  channelId?: string | null;
  shareType?: PromoShareType;
  helperId?: string | null;
  campaignId?: string | null;
  helperPartnerProfileId?: string | null;
  origin?: string;
}): string {
  const origin = (opts.origin ?? canonicalSiteOrigin()).replace(/\/$/, "");
  const u = new URL(`${origin}/c/${encodeURIComponent(opts.slug.trim())}`);
  if (opts.campaignId?.trim()) u.searchParams.set("campaign", opts.campaignId.trim());
  if (opts.channelId?.trim()) u.searchParams.set("channel", opts.channelId.trim());
  if (opts.shareType === "direct" || opts.shareType === "helper") u.searchParams.set("type", opts.shareType);
  if (opts.helperPartnerProfileId?.trim()) u.searchParams.set("helper", opts.helperPartnerProfileId.trim());
  else if (opts.helperId?.trim()) u.searchParams.set("helper", opts.helperId.trim());
  return u.toString();
}

export type ParsedPromotionUrl = {
  campaignId: string | null;
  channelId: string | null;
  shareType: PromoShareType;
  /** 레거시 public.helpers 행 참조 (?helper= 에 캠페인 미지정 시) */
  helperId: string | null;
  /** 캠페인 헬퍼 (?campaign= 과 함께 public.helper_partners 참조) */
  helperPartnerProfileId: string | null;
};

export function parsePromotionQuery(searchOrParams: string | URLSearchParams): ParsedPromotionUrl {
  const p =
    typeof searchOrParams === "string" ? new URLSearchParams(searchOrParams.replace(/^\?/, "")) : searchOrParams;

  const campaignRaw = p.get("campaign")?.trim() ?? "";
  const campaignId = isPromotionUuid(campaignRaw) ? campaignRaw : null;

  const ch = p.get("channel")?.trim() ?? "";
  const channelId = isPromotionUuid(ch) ? ch : null;

  const typeRaw = p.get("type")?.trim().toLowerCase() ?? "";
  const wantsHelperType = typeRaw === "helper";

  const hh = p.get("helper")?.trim() ?? "";
  const helperUuid = isPromotionUuid(hh) ? hh : null;

  if (campaignId) {
    const shareType: PromoShareType = helperUuid ? "helper" : "direct";
    return {
      campaignId,
      channelId,
      shareType,
      helperId: null,
      helperPartnerProfileId: helperUuid,
    };
  }

  const shareType: PromoShareType = wantsHelperType ? "helper" : "direct";

  const helperId = shareType === "helper" && helperUuid ? helperUuid : null;

  return {
    campaignId: null,
    channelId,
    shareType,
    helperId,
    helperPartnerProfileId: null,
  };
}

const VISITOR_STORAGE_KEY = "linko.promo_vid";

/** 세션 간 유입 식별(익명) */
export function getOrCreatePromotionVisitorId(): string {
  if (typeof window === "undefined") return "";

  try {
    const existed = window.localStorage.getItem(VISITOR_STORAGE_KEY)?.trim();
    if (existed && existed.length >= 8) return existed;
    const nid = crypto.randomUUID();
    window.localStorage.setItem(VISITOR_STORAGE_KEY, nid);
    return nid;
  } catch {
    return crypto.randomUUID();
  }
}

export function normalizePromotionContext(raw: ParsedPromotionUrl): ParsedPromotionUrl {
  if (raw.campaignId) {
    if (raw.shareType === "helper" && !raw.helperPartnerProfileId) {
      return { ...raw, shareType: "direct" };
    }
    return raw;
  }
  if (raw.shareType === "helper" && !raw.helperId) {
    return { ...raw, shareType: "direct", helperId: null };
  }
  return raw;
}

export function mapCardLinkClickToPromo(link: Pick<CardLink, "type" | "label">): {
  event_type: CardPromoEventType;
  button_type: string;
} {
  const label = link.label ?? "";

  switch (link.type) {
    case "phone":
      return { event_type: "call_click", button_type: "phone" };
    case "kakao":
      return { event_type: "kakao_click", button_type: "kakao" };
    case "email":
      return { event_type: "contact_click", button_type: "email" };
    default:
      if (/문의|상담|예약|주문|견적|연락|구매|신청/i.test(label)) {
        return { event_type: "contact_click", button_type: link.type };
      }
      return { event_type: "contact_click", button_type: link.type };
  }
}
