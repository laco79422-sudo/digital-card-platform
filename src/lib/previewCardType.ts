import { BRAND_DISPLAY_NAME } from "@/lib/brand";

export const PREVIEW_CARD_TYPES = [
  "person",
  "store",
  "location",
  "result",
  "event",
  "trust",
] as const;

export type PreviewCardType = (typeof PREVIEW_CARD_TYPES)[number];

export const PREVIEW_CARD_TYPE_LABEL: Record<PreviewCardType, string> = {
  person: "이름 중심",
  store: "매장 홍보",
  location: "주소 중심",
  result: "결과 강조",
  event: "이벤트/할인",
  trust: "후기/신뢰",
};

function clean(v: string | null | undefined, max = 120): string {
  return (v || "").trim().slice(0, max);
}

export function normalizePreviewCardType(v: string | null | undefined): PreviewCardType {
  if (!v) return "person";
  return (PREVIEW_CARD_TYPES as readonly string[]).includes(v) ? (v as PreviewCardType) : "person";
}

export function buildPreviewMeta(input: {
  type?: string | null;
  person_name?: string | null;
  brand_name?: string | null;
  tagline?: string | null;
  intro?: string | null;
  address?: string | null;
  trust_metric?: string | null;
}): { type: PreviewCardType; title: string; description: string; name: string; brandName: string; headline: string } {
  const type = normalizePreviewCardType(input.type);
  const name = clean(input.person_name, 80) || "이름";
  const brandName = clean(input.brand_name, 80) || BRAND_DISPLAY_NAME;
  const headline = clean(input.tagline, 160) || clean(input.intro, 160) || "명함 미리보기";
  const address = clean(input.address, 180);
  const trust = clean(input.trust_metric, 160);

  switch (type) {
    case "store":
      return {
        type,
        title: brandName,
        description: (headline || clean(input.intro, 220) || "매장 정보를 확인해 보세요").slice(0, 300),
        name,
        brandName,
        headline,
      };
    case "location":
      return {
        type,
        title: brandName || name,
        description: (address || headline || clean(input.intro, 220) || "위치 정보를 확인해 보세요").slice(0, 300),
        name,
        brandName,
        headline: address || headline,
      };
    case "result":
      return {
        type,
        title: headline || name,
        description: `${brandName} · ${clean(input.intro, 220) || "성과를 확인해 보세요"}`.slice(0, 300),
        name,
        brandName,
        headline,
      };
    case "event":
      return {
        type,
        title: `${brandName} 이벤트`.slice(0, 80),
        description: `${headline}`.slice(0, 300),
        name,
        brandName,
        headline,
      };
    case "trust":
      return {
        type,
        title: name,
        description: `${brandName} · ${trust || headline}`.slice(0, 300),
        name,
        brandName,
        headline: trust || headline,
      };
    case "person":
    default:
      return {
        type: "person",
        title: name,
        description: `${brandName} · ${headline}`.slice(0, 300),
        name,
        brandName,
        headline,
      };
  }
}

