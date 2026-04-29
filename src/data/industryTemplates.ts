import { buildIndustryPromoShareText } from "@/lib/cardPromoShareText";
import { getIndustryOgFallback } from "@/lib/industryOg";
import type { CardEditorDraft } from "@/stores/cardEditorDraftStore";
import type { RevenueCardTemplateId } from "@/data/revenueCardTemplates";

/** 업종 선택 ↔ 매출 템플릿 ID (동일 키 사용) */
export type IndustryTemplateId = RevenueCardTemplateId;

export type IndustryTemplateRecord = {
  /** 표시용 업종명 */
  industry: string;
  /** 매출 템플릿·드래프트 생성 키 */
  templateId: IndustryTemplateId;
  name: string;
  title: string;
  headline: string;
  description: string;
  /** 첫 CTA 버튼 라벨 (→ 포함 가능) */
  ctaText: string;
  /** {link} 에 공개 명함 URL 치환 */
  promoText: string;
};

export const INDUSTRY_TEMPLATE_LIST: IndustryTemplateRecord[] = [
  {
    templateId: "car-wash",
    industry: "세차장",
    name: "우리동네 세차장",
    title: "실내·외 프리미엄 세차",
    headline: "지금 바로 맡길 수 있는 세차장",
    description: "세차 상담부터 예약까지 한 번에 연결됩니다.",
    ctaText: "바로 예약하기",
    promoText:
      "세차 맡길 곳 찾고 계신가요?\n지금 바로 맡길 수 있어요.\n\n👉 명함 보기\n{link}",
  },
  {
    templateId: "restaurant",
    industry: "음식점",
    name: "우리 동네 식당",
    title: "신선한 재료 · 매일 조리",
    headline: "지금 바로 주문 가능합니다",
    description: "메뉴 확인 후 전화·배달 앱으로 바로 주문하세요.",
    ctaText: "지금 주문하기",
    promoText:
      "오늘 뭐 먹을지 고민된다면?\n대표 메뉴와 주문 정보를 바로 확인해 보세요.\n\n👉 메뉴 보기\n{link}",
  },
  {
    templateId: "interior",
    industry: "인테리어",
    name: "OO 인테리어",
    title: "주거·상업 시공",
    headline: "무료 견적부터 시작합니다",
    description: "전·후 사진으로 결과를 먼저 확인하고 상담하세요.",
    ctaText: "무료 견적 받기",
    promoText:
      "시공 전후가 궁금하다면?\n사례를 보고 바로 견적 문의해 보세요.\n\n👉 시공 사례 보기\n{link}",
  },
  {
    templateId: "salon",
    industry: "미용실",
    name: "OO 헤어",
    title: "컷·펌·염색",
    headline: "오늘 예약 가능한 시간 있습니다",
    description: "스타일 상담 후 바로 예약·방문하세요.",
    ctaText: "지금 예약하기",
    promoText:
      "머리 하실 시간 있으세요?\n예약 후 바로 방문 가능합니다.\n\n👉 명함 보기\n{link}",
  },
  {
    templateId: "online-sales",
    industry: "온라인 판매",
    name: "OO 스토어",
    title: "공식 판매처",
    headline: "지금 바로 구매 가능합니다",
    description: "상품 이미지·가격 확인 후 링크에서 주문하세요.",
    ctaText: "지금 구매하기",
    promoText:
      "찾던 상품 있으세요?\n링크에서 바로 구매 가능합니다.\n\n👉 명함 보기\n{link}",
  },
  {
    templateId: "real-estate",
    industry: "부동산",
    name: "OO 공인중개사",
    title: "매물 전문",
    headline: "지금 바로 확인 가능한 매물",
    description: "매물 사진·위치·가격을 한곳에 모았습니다. 문의는 버튼 한 번.",
    ctaText: "매물 문의하기",
    promoText:
      "관심 매물 찾고 계신가요?\n사진·위치 먼저 확인해 보세요.\n\n👉 명함 보기\n{link}",
  },
  {
    templateId: "academy",
    industry: "학원/과외",
    name: "OO 학원",
    title: "전 과목 대비",
    headline: "지금 상담 가능합니다",
    description: "과목·수업 방식·후기 확인 후 무료 상담으로 연결됩니다.",
    ctaText: "무료 상담 받기",
    promoText:
      "학원·과외 알아보고 계신가요?\n무료 상담으로 일정 잡아 보세요.\n\n👉 명함 보기\n{link}",
  },
  {
    templateId: "fitness-pt",
    industry: "헬스/PT",
    name: "OO PT 스튜디오",
    title: "1:1 맞춤 트레이닝",
    headline: "지금 시작하면 달라집니다",
    description: "Before/After·프로그램 안내 후 체험 신청까지 한 번에.",
    ctaText: "체험 신청",
    promoText:
      "운동 시작 고민 중이신가요?\n오늘부터 체험 가능합니다.\n\n👉 명함 보기\n{link}",
  },
  {
    templateId: "auto-repair",
    industry: "자동차 정비소",
    name: "OO 자동차 정비",
    title: "점검·정비 전문",
    headline: "오늘 바로 점검 가능합니다",
    description: "정비 항목·가격 안내 후 전화로 바로 예약하세요.",
    ctaText: "지금 예약",
    promoText:
      "차 점검이 필요하신가요?\n당일 예약 문의 가능합니다.\n\n👉 명함 보기\n{link}",
  },
  {
    templateId: "cleaning",
    industry: "청소/입주청소",
    name: "OO 입주청소",
    title: "거주·상업 청소",
    headline: "집을 새집처럼",
    description: "전·후 사진과 서비스 범위 확인 후 견적 요청까지 연결됩니다.",
    ctaText: "견적 받기",
    promoText:
      "청소·입주 맡기실 분 계신가요?\n견적부터 빠르게 안내드려요.\n\n👉 명함 보기\n{link}",
  },
  {
    templateId: "freelancer",
    industry: "프리랜서",
    name: "OO 스튜디오",
    title: "디자인 · 개발 외주",
    headline: "바로 작업 가능합니다",
    description: "포트폴리오·작업 분야 확인 후 의뢰·상담으로 연결됩니다.",
    ctaText: "의뢰하기",
    promoText:
      "프로젝트 파트너 찾고 계신가요?\n포트폴리오 확인 후 바로 연락 주세요.\n\n👉 명함 보기\n{link}",
  },
  {
    templateId: "photo-studio",
    industry: "촬영/스튜디오",
    name: "OO 스튜디오",
    title: "프로필·제품 촬영",
    headline: "지금 예약 가능합니다",
    description: "촬영 샘플·가격 확인 후 예약 버튼으로 일정을 잡으세요.",
    ctaText: "촬영 예약",
    promoText:
      "촬영 일정 잡고 계신가요?\n샘플·가격 확인 후 예약하세요.\n\n👉 명함 보기\n{link}",
  },
  {
    templateId: "moving-truck",
    industry: "이사/용달",
    name: "OO 이사·용달",
    title: "1톤·라보·탑차",
    headline: "오늘 바로 이동 가능합니다",
    description: "차량 정보·요금 안내 후 전화·카톡으로 바로 문의하세요.",
    ctaText: "문의하기",
    promoText:
      "이사·용달 필요하신가요?\n차량·요금 안내 바로 드려요.\n\n👉 명함 보기\n{link}",
  },
  {
    templateId: "resale",
    industry: "중고거래/개인 판매",
    name: "직거래 판매",
    title: "상품 상태 확인",
    headline: "지금 바로 구매 가능합니다",
    description: "상품 이미지·가격 확인 후 연락 버튼으로 바로 문의하세요.",
    ctaText: "구매 문의",
    promoText:
      "관심 상품 있으신가요?\n직거래 문의 바로 가능합니다.\n\n👉 명함 보기\n{link}",
  },
  {
    templateId: "flower-shop",
    industry: "꽃집",
    name: "OO 플라워",
    title: "생화·꽃다발",
    headline: "오늘 바로 꽃 준비 가능합니다",
    description: "꽃 사진·가격 확인 후 주문 버튼으로 바로 연결됩니다.",
    ctaText: "지금 주문하기",
    promoText:
      "오늘 맞춰 꽃 필요하세요?\n사진·가격 보고 지금 주문하세요.\n\n👉 명함 보기\n{link}",
  },
  {
    templateId: "cafe",
    industry: "카페",
    name: "OO 카페",
    title: "대표 메뉴·매장",
    headline: "지금 바로 주문 가능합니다",
    description: "대표 메뉴·위치 확인 후 매장 방문·주문으로 바로 연결됩니다.",
    ctaText: "매장 방문하기",
    promoText:
      "지금 카페 오실래요?\n메뉴·위치 확인하고 바로 방문·주문하세요.\n\n👉 명함 보기\n{link}",
  },
  {
    templateId: "pet-grooming",
    industry: "반려동물 미용",
    name: "OO 펫 미용",
    title: "컷·목욕·클리핑",
    headline: "오늘 예약 가능합니다",
    description: "전·후 사진·가격 확인 후 예약 버튼으로 바로 잡으세요.",
    ctaText: "예약하기",
    promoText:
      "오늘 미용 예약 필요하세요?\n전후 사진·가격 확인 후 바로 예약하세요.\n\n👉 명함 보기\n{link}",
  },
  {
    templateId: "nail-shop",
    industry: "네일샵",
    name: "OO 네일",
    title: "젤·패디·아트",
    headline: "오늘 시술 가능합니다",
    description: "디자인 사진·가격 확인 후 예약 버튼으로 바로 연결됩니다.",
    ctaText: "지금 예약",
    promoText:
      "오늘 네일 받으실래요?\n디자인·가격 보고 지금 예약하세요.\n\n👉 명함 보기\n{link}",
  },
  {
    templateId: "pilates-yoga",
    industry: "필라테스·요가",
    name: "OO 필라테스",
    title: "그룹·개인 수업",
    headline: "지금 체험 가능합니다",
    description: "수업 사진·프로그램 확인 후 상담·체험으로 바로 연결됩니다.",
    ctaText: "체험 신청",
    promoText:
      "오늘부터 운동 시작할까요?\n체험 가능 여부 바로 확인해 보세요.\n\n👉 명함 보기\n{link}",
  },
  {
    templateId: "tutoring-visit",
    industry: "학습지·방문교육",
    name: "OO 학습·방문",
    title: "과목·대상 맞춤",
    headline: "지금 상담 가능합니다",
    description: "과목·대상 확인 후 무료 상담 버튼으로 바로 연결됩니다.",
    ctaText: "무료 상담",
    promoText:
      "학습·방문 상담 받아보실래요?\n지금 무료로 일정 잡을 수 있어요.\n\n👉 명함 보기\n{link}",
  },
  {
    templateId: "insurance-agent",
    industry: "보험 설계사",
    name: "OO 보험 설계",
    title: "맞춤 보험 상담",
    headline: "내게 맞는 보험 상담",
    description: "상담 분야 선택 후 상담 신청 버튼으로 바로 연결됩니다.",
    ctaText: "상담 신청",
    promoText:
      "보험 정리 필요하세요?\n분야만 골라도 오늘 바로 상담 연결됩니다.\n\n👉 명함 보기\n{link}",
  },
  {
    templateId: "finance-consult",
    industry: "대출·금융 상담",
    name: "OO 금융 상담",
    title: "상품·조건 안내",
    headline: "지금 바로 상담 가능합니다",
    description: "상품 안내 확인 후 상담 버튼으로 즉시 연결됩니다.",
    ctaText: "상담하기",
    promoText:
      "자금·대출 상담 필요하세요?\n지금 바로 가능 여부 확인해 보세요.\n\n👉 명함 보기\n{link}",
  },
  {
    templateId: "vehicle-rent",
    industry: "차량 렌트·리스",
    name: "OO 렌트카",
    title: "일·월 렌트",
    headline: "오늘 바로 이용 가능합니다",
    description: "차량 리스트·가격 확인 후 문의 버튼으로 견적 받으세요.",
    ctaText: "문의하기",
    promoText:
      "오늘 차량 필요하세요?\n차량·가격 보고 바로 문의하세요.\n\n👉 명함 보기\n{link}",
  },
  {
    templateId: "used-car-sales",
    industry: "중고차 판매",
    name: "OO 중고차",
    title: "매물 확인",
    headline: "지금 바로 차량 확인",
    description: "차량 이미지·가격 확인 후 문의 버튼으로 바로 연결됩니다.",
    ctaText: "차량 문의",
    promoText:
      "관심 차량 있으세요?\n사진·가격 보고 지금 바로 문의하세요.\n\n👉 명함 보기\n{link}",
  },
  {
    templateId: "onsite-service",
    industry: "출장 서비스(수리·설치)",
    name: "OO 출장 서비스",
    title: "현장 방문",
    headline: "지금 바로 방문 가능합니다",
    description: "서비스 목록 확인 후 전화·요청 버튼으로 즉시 연결됩니다.",
    ctaText: "지금 요청",
    promoText:
      "오늘 현장 출동 필요하세요?\n서비스 확인 후 지금 요청하세요.\n\n👉 명함 보기\n{link}",
  },
  {
    templateId: "photo-retouch",
    industry: "사진 보정·디자인",
    name: "OO 리터칭",
    title: "보정·합성",
    headline: "빠르게 작업 가능합니다",
    description: "작업 예시 확인 후 의뢰·상담 버튼으로 바로 연결됩니다.",
    ctaText: "작업 의뢰",
    promoText:
      "마감 급하세요?\n예시 보고 오늘 바로 의뢰 연결됩니다.\n\n👉 명함 보기\n{link}",
  },
  {
    templateId: "video-production",
    industry: "유튜브·영상 제작",
    name: "OO 영상 스튜디오",
    title: "촬영·편집",
    headline: "영상 제작 도와드립니다",
    description: "포트폴리오 확인 후 제작 문의 버튼으로 바로 연결됩니다.",
    ctaText: "제작 문의",
    promoText:
      "영상 제작 맡기실래요?\n포트폴리오 보고 지금 문의하세요.\n\n👉 명함 보기\n{link}",
  },
  {
    templateId: "blog-marketing",
    industry: "블로그 마케팅",
    name: "OO 마케팅",
    title: "노출·키워드",
    headline: "상위 노출 도와드립니다",
    description: "진행 사례 확인 후 문의 버튼으로 상담 연결됩니다.",
    ctaText: "문의하기",
    promoText:
      "상위 노출이 필요하세요?\n사례 확인 후 오늘 바로 상담받으세요.\n\n👉 명함 보기\n{link}",
  },
  {
    templateId: "event-planning",
    industry: "행사·이벤트",
    name: "OO 이벤트",
    title: "기획·진행",
    headline: "행사 진행 가능합니다",
    description: "진행 사례 확인 후 행사 문의 버튼으로 바로 연결됩니다.",
    ctaText: "행사 문의",
    promoText:
      "행사 준비 중이세요?\n사례 보고 오늘 바로 문의하세요.\n\n👉 명함 보기\n{link}",
  },
  {
    templateId: "music-lesson",
    industry: "악기 레슨",
    name: "OO 음악 레슨",
    title: "1:1·그룹",
    headline: "지금 레슨 가능합니다",
    description: "레슨 영상·레벨 확인 후 신청 버튼으로 바로 연결됩니다.",
    ctaText: "레슨 신청",
    promoText:
      "오늘 레슨 시작할까요?\n영상 보고 지금 신청하세요.\n\n👉 명함 보기\n{link}",
  },
  {
    templateId: "wedding",
    industry: "결혼·웨딩",
    name: "OO 웨딩",
    title: "스튜디오·본식",
    headline: "지금 상담 가능합니다",
    description: "진행 사례 확인 후 상담 예약 버튼으로 바로 연결됩니다.",
    ctaText: "상담 예약",
    promoText:
      "웨딩 상담 받아보실래요?\n사례 확인 후 오늘 바로 예약하세요.\n\n👉 명함 보기\n{link}",
  },
  {
    templateId: "travel-tour",
    industry: "여행·투어",
    name: "OO 여행",
    title: "패키지·자유",
    headline: "지금 예약 가능합니다",
    description: "여행 상품·가격 확인 후 예약 버튼으로 바로 연결됩니다.",
    ctaText: "예약하기",
    promoText:
      "오늘 여행 예약하실래요?\n상품·가격 보고 바로 예약하세요.\n\n👉 명함 보기\n{link}",
  },
  {
    templateId: "translation",
    industry: "번역·통역",
    name: "OO 번역·통역",
    title: "문서·현장",
    headline: "빠르게 번역해드립니다",
    description: "언어·분야 확인 후 번역 문의 버튼으로 바로 연결됩니다.",
    ctaText: "번역 문의",
    promoText:
      "급한 번역·통역 있으세요?\n분량만 알려도 오늘 바로 안내드려요.\n\n👉 명함 보기\n{link}",
  },
  {
    templateId: "legal-tax",
    industry: "법률·세무 상담",
    name: "OO 법무·세무",
    title: "분야별 상담",
    headline: "전문 상담 가능합니다",
    description: "분야 선택 후 상담 예약 버튼으로 바로 연결됩니다.",
    ctaText: "상담 예약",
    promoText:
      "법무·세무 고민 있으세요?\n오늘 초기 상담부터 가능합니다.\n\n👉 명함 보기\n{link}",
  },
];

const byTemplateId = Object.fromEntries(
  INDUSTRY_TEMPLATE_LIST.map((t) => [t.templateId, t]),
) as Record<IndustryTemplateId, IndustryTemplateRecord>;

export function getIndustryTemplate(id: IndustryTemplateId): IndustryTemplateRecord {
  return byTemplateId[id];
}

/** 업종 템플릿 필드를 명함 초안에 반영 (사용자 수정 가능) */
export function mergeIndustryCopyIntoDraft(
  draft: CardEditorDraft,
  tmpl: IndustryTemplateRecord,
): CardEditorDraft {
  const imgUrl = getIndustryOgFallback(tmpl.industry);
  return {
    ...draft,
    brand_name: tmpl.name,
    job_title: tmpl.title,
    tagline: tmpl.headline,
    intro: tmpl.description,
    industry: tmpl.industry,
    auto_image_url: imgUrl,
    og_image_url: imgUrl,
    brand_image_url: imgUrl,
    imageUrl: imgUrl,
  };
}

/** 첫 번째 CTA 라벨만 교체 (모바일 퍼스트 상단 버튼) */
export function applyCtaLabelToPrimaryLinkLabel(ctaText: string): string {
  return ctaText.replace(/→\s*$/u, "").trim();
}

export function resolvePromoShareTextWithIndustryTemplate(
  shareUrl: string,
  draft: Pick<CardEditorDraft, "slug" | "tagline" | "intro" | "brand_name" | "person_name">,
): string {
  const slug = draft.slug?.trim().toLowerCase() ?? "";
  for (const t of INDUSTRY_TEMPLATE_LIST) {
    const prefix = `${t.templateId}-`;
    if (slug.startsWith(prefix)) {
      return t.promoText.replace(/\{link\}/g, shareUrl);
    }
  }
  return buildIndustryPromoShareText(shareUrl, draft);
}

export function parseIndustryQuery(search: string): IndustryTemplateId | null {
  const raw = new URLSearchParams(search).get("industry")?.trim().toLowerCase();
  if (!raw) return null;
  return INDUSTRY_TEMPLATE_LIST.some((t) => t.templateId === raw) ? (raw as IndustryTemplateId) : null;
}
