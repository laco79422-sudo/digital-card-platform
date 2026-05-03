import type { BusinessCard } from "@/types/domain";
import type { CardIndustryPayload } from "@/types/cardIndustry";

function displayName(card: BusinessCard): string {
  const b = card.brand_name?.trim();
  if (b) return b;
  return card.person_name?.trim() || "내 브랜드";
}

function isCardDesignExpert(industry: CardIndustryPayload | null | undefined): boolean {
  return Boolean(industry?.group === "linko_member" && industry.type === "card_design_expert");
}

/** 직접 입력은 UI에서 별도 처리 */
export function buildHelperCampaignTitlePresets(card: BusinessCard): string[] {
  const name = displayName(card);
  const industry = card.card_industry ?? null;
  if (isCardDesignExpert(industry)) {
    return [
      "명함디자인 제작 문의 고객 모집",
      "디지털 명함 제작 의뢰 홍보",
      "Linko 명함디자인 전문가 홍보",
      "제작 의뢰 연결 캠페인",
    ];
  }
  return [
    `${name} 상담 고객 모집`,
    `${name} 홍보 파트너 모집`,
    "공간 상담 문의 고객 연결",
    "인테리어 상담 유입 캠페인",
  ];
}
