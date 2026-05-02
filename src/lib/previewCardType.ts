import type { BusinessCard } from "@/types/domain";

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

/** 명함 만들기 초기 선택 — 결과·이벤트·후기 레이아웃 대신 사용자 친화 3종 */
export const ONBOARD_LINKO_CARD_TYPES = ["person", "store", "location"] as const;
export type OnboardLinkoCardType = (typeof ONBOARD_LINKO_CARD_TYPES)[number];

export const ONBOARD_LINKO_CARD_TYPE_LABEL: Record<OnboardLinkoCardType, string> = {
  person: "개인형",
  store: "사업자형",
  location: "매장형",
};

export function coerceOnboardCardType(raw: PreviewCardType): OnboardLinkoCardType {
  return (ONBOARD_LINKO_CARD_TYPES as readonly string[]).includes(raw)
    ? (raw as OnboardLinkoCardType)
    : "person";
}

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
  job_title?: string | null;
  tagline?: string | null;
  marketing_title?: string | null;
  intro?: string | null;
  address?: string | null;
  trust_metric?: string | null;
}): { type: PreviewCardType; title: string; description: string; name: string; brandName: string; headline: string } {
  const type = normalizePreviewCardType(input.type);
  const name = clean(input.person_name, 80);
  const brandName = clean(input.brand_name, 80);
  const marketingHead = clean(input.marketing_title, 120);
  const taglineOne = clean(input.tagline, 160);
  const introSnippet = clean(input.intro, 160);
  /** 한 줄 후크(공유)·히어로 보조 줄 — 마케팅 헤드라인과 구분 */
  const hookLine = taglineOne || introSnippet;
  const address = clean(input.address, 180);
  const trust = clean(input.trust_metric, 160);

  switch (type) {
    case "store":
      return {
        type,
        title: marketingHead || brandName || name,
        description: [clean(input.job_title, 140), hookLine, clean(input.intro, 220)]
          .filter(Boolean)
          .join(" · ")
          .slice(0, 300),
        name,
        brandName,
        headline: hookLine,
      };
    case "location":
      return {
        type,
        title: marketingHead || brandName || name,
        description: [clean(input.job_title, 120), address, clean(input.intro, 220)]
          .filter(Boolean)
          .join(" · ")
          .slice(0, 300),
        name,
        brandName,
        headline: address || hookLine,
      };
    case "result":
      return {
        type,
        title: hookLine || name,
        description: `${brandName} · ${clean(input.intro, 220)}`.trim().replace(/^·\s*/, "").slice(0, 300),
        name,
        brandName,
        headline: hookLine,
      };
    case "event":
      return {
        type,
        title: `${brandName} 이벤트`.slice(0, 80),
        description: `${hookLine}`.slice(0, 300),
        name,
        brandName,
        headline: hookLine,
      };
    case "trust":
      return {
        type,
        title: name,
        description: `${brandName} · ${trust || hookLine}`.slice(0, 300),
        name,
        brandName,
        headline: trust || hookLine,
      };
    case "person":
    default: {
      const taglineClean = clean(input.tagline, 160);
      const oneLineIntro = clean(input.intro, 160);
      const specialty = clean(input.trust_metric, 160);
      const regionLine = address;
      const desc =
        [specialty, regionLine, oneLineIntro].filter(Boolean).join(" · ") ||
        `${brandName ? `${brandName} · ` : ""}${oneLineIntro}`.trim().replace(/^·\s*/, "");
      return {
        type: "person",
        title: marketingHead || name || brandName,
        description: desc.slice(0, 300),
        name,
        brandName,
        headline: taglineClean || oneLineIntro || specialty,
      };
    }
  }
}

export function resolveCardPreviewVariant(card: Pick<BusinessCard, "preview_card_type">, override?: PreviewCardType): PreviewCardType {
  if (override) return override;
  return normalizePreviewCardType(card.preview_card_type);
}

