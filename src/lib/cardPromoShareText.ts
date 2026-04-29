import type { CardEditorDraft } from "@/stores/cardEditorDraftStore";

export type PromoIndustry =
  | "car-wash"
  | "restaurant"
  | "interior"
  | "salon"
  | "online-sales"
  | "generic";

/** 슬러그·브랜드·태그라인으로 업종 추정 (매출 템플릿 slug 접두어 우선) */
export function inferPromoIndustryFromDraft(
  draft: Pick<CardEditorDraft, "slug" | "brand_name" | "tagline" | "intro">,
): PromoIndustry {
  const slug = draft.slug?.trim().toLowerCase() ?? "";
  if (slug.startsWith("car-wash")) return "car-wash";
  if (slug.startsWith("restaurant")) return "restaurant";
  if (slug.startsWith("interior")) return "interior";
  if (slug.startsWith("salon")) return "salon";
  if (slug.startsWith("shop-") || slug.includes("online")) return "online-sales";

  const blob = `${draft.brand_name} ${draft.tagline} ${draft.intro ?? ""}`.toLowerCase();
  if (/세차|세차장|wash|car\s*wash/.test(blob)) return "car-wash";
  if (/식당|음식|맛집|배달|주문|restaurant|food/.test(blob)) return "restaurant";
  if (/인테리어|시공|견적|리모델/.test(blob)) return "interior";
  if (/헤어|미용|살롱|예약|네일|헤어샵/.test(blob)) return "salon";
  if (/구매|스토어|판매|쇼핑|상품|스마트스토어/.test(blob)) return "online-sales";

  return "generic";
}

const INDUSTRY_HOOKS: Record<Exclude<PromoIndustry, "generic">, readonly [string, string]> = {
  "car-wash": ["세차 맡길 곳 찾고 계신가요?", "지금 바로 가능합니다"],
  restaurant: ["맛있는 한 끼, 지금 주문하세요.", "배달·포장 바로 가능합니다"],
  interior: ["시공 결과가 곧 신뢰입니다.", "무료 견적으로 시작해 보세요"],
  salon: ["오늘 예약 가능한 시간 있어요.", "스타일 상담 후 바로 예약하세요"],
  "online-sales": ["지금 바로 구매 가능한 상품이에요.", "링크에서 확인·주문하세요"],
};

/** 카카오·문자에 붙여 넣는 업종 맞춤 홍보 블록 */
export function buildIndustryPromoShareText(
  shareUrl: string,
  draft: Pick<CardEditorDraft, "tagline" | "intro" | "brand_name" | "person_name" | "slug">,
  industry?: PromoIndustry,
): string {
  const ind = industry ?? inferPromoIndustryFromDraft(draft);
  if (ind !== "generic") {
    const [a, b] = INDUSTRY_HOOKS[ind];
    return `${a}\n${b}\n\n👉 명함 보기\n${shareUrl}`;
  }

  const tag = draft.tagline?.trim();
  const brand = draft.brand_name?.trim();
  const person = draft.person_name?.trim();
  const introFirst = draft.intro?.trim()?.split(/\n/)?.[0]?.trim()?.slice(0, 72);

  const line1 = tag || brand || person || "안녕하세요";
  let line2 =
    introFirst && introFirst !== line1
      ? introFirst
      : brand && person && brand !== person
        ? `${person} · ${brand}`
        : "지금 바로 가능합니다";

  if (line2 === line1) line2 = "지금 바로 가능합니다";

  return `${line1}\n${line2}\n\n👉 명함 보기\n${shareUrl}`;
}

/** @deprecated 호환용 — 업종 추론 버전 사용 권장 */
export function buildCardPromoShareText(
  shareUrl: string,
  draft: Pick<CardEditorDraft, "tagline" | "intro" | "brand_name" | "person_name" | "slug">,
): string {
  return buildIndustryPromoShareText(shareUrl, draft);
}
