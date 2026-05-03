import type { PreviewCardType } from "@/lib/previewCardType";
import type { DigitalCardServiceLine } from "@/types/domain";

/** 새 명함 업로드 테스트용 안전 공개 HTTPS 이미지 */
export const SAMPLE_HERO_EDITOR_URL =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1200&q=80";

export const SAMPLE_FALLBACK_PHONE = "010-0000-0000";

function serviceFromTags(tags: string[]): DigitalCardServiceLine[] {
  return tags.map((t) => ({
    title: t.trim(),
    body: `${t.trim()} 상담·문의에 바로 연결됩니다.`,
  }));
}

/** 유형 선택 기준 즉시 샘플 (마법사 없이 채우기) */
export function partialDraftQuickSample(cardType: PreviewCardType): {
  brand_name?: string;
  person_name?: string;
  tagline?: string;
  intro?: string;
  marketing_title?: string;
  phone?: string;
  kakao_url?: string;
  card_type?: PreviewCardType;
  services?: DigitalCardServiceLine[];
} {
  switch (cardType) {
    case "store":
      return {
        brand_name: "미노 인테리어",
        person_name: "김민수",
        tagline: "공간을 바꾸면 삶이 바뀝니다",
        marketing_title: "공간을 바꾸면 삶이 바뀝니다",
        intro: "인테리어 상담과 시공 정보를 한눈에 보여드립니다",
        phone: SAMPLE_FALLBACK_PHONE,
        kakao_url: "",
        card_type: "store",
        services: serviceFromTags(["시공 상담", "견적 문의", "사례 보기"]),
      };
    case "location":
      return {
        brand_name: "옥토 가구공방",
        person_name: "김민수",
        tagline: "공간에 맞는 가구를 직접 제작합니다",
        marketing_title: "공간에 맞는 가구를 직접 제작합니다",
        intro: "맞춤 수납장과 원목가구 상담을 도와드립니다",
        phone: SAMPLE_FALLBACK_PHONE,
        kakao_url: "",
        card_type: "location",
        services: serviceFromTags(["방문 상담", "제작 문의", "위치 안내"]),
      };
    case "person":
    default:
      return {
        person_name: "김민수",
        brand_name: "",
        tagline: "고객이 나를 쉽게 찾도록",
        marketing_title: "고객이 나를 쉽게 찾도록",
        intro: "프로필, 서비스, 연락처를 한 번에 보여드립니다",
        phone: SAMPLE_FALLBACK_PHONE,
        kakao_url: "",
        card_type: "person",
        services: serviceFromTags(["검색·SNS 연결", "클릭→문의", "고객 유지"]),
      };
  }
}
