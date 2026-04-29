import type { CardEditorDraft } from "@/stores/cardEditorDraftStore";
import { createEmptyDraft, mergeDraftDefaults } from "@/stores/cardEditorDraftStore";
import type { CardLinkType } from "@/types/domain";

export type RevenueCardTemplateId =
  | "car-wash"
  | "restaurant"
  | "interior"
  | "salon"
  | "online-sales";

export type RevenueTemplateMeta = {
  id: RevenueCardTemplateId;
  /** 카드 제목 */
  label: string;
  emoji: string;
  /** 한 줄 요약 (피커용) */
  hook: string;
  bullets: readonly string[];
  /** 메인 CTA 라벨 시연용 */
  primaryCta: string;
};

export const REVENUE_CARD_TEMPLATE_IDS = [
  "car-wash",
  "restaurant",
  "interior",
  "salon",
  "online-sales",
] as const satisfies readonly RevenueCardTemplateId[];

export const REVENUE_TEMPLATE_LIST: RevenueTemplateMeta[] = [
  {
    id: "car-wash",
    label: "세차장",
    emoji: "🚗",
    hook: "전·후 사진으로 신뢰",
    bullets: ["전/후 사진", "위치", "전화·카톡"],
    primaryCta: "바로 예약하기 →",
  },
  {
    id: "restaurant",
    label: "음식점",
    emoji: "🍜",
    hook: "주문·리뷰 한 번에",
    bullets: ["대표 메뉴 3", "리뷰", "배달·전화"],
    primaryCta: "지금 주문하기 →",
  },
  {
    id: "interior",
    label: "인테리어",
    emoji: "🏠",
    hook: "시공 전후가 증명",
    bullets: ["전/후 사진", "견적 문의", "상담"],
    primaryCta: "무료 견적 받기 →",
  },
  {
    id: "salon",
    label: "미용실",
    emoji: "💇",
    hook: "예약이 매출",
    bullets: ["스타일 컷", "가격", "예약"],
    primaryCta: "지금 예약하기 →",
  },
  {
    id: "online-sales",
    label: "온라인 판매",
    emoji: "🛒",
    hook: "구매까지 한 클릭",
    bullets: ["상품 이미지", "가격", "구매 링크"],
    primaryCta: "지금 구매하기 →",
  },
];

type LinkDef = { label: string; type: CardLinkType; url: string };

function row(id: string, def: LinkDef) {
  return { id, ...def };
}

/** 모바일 퍼스트 — 상단 2개가 히어로 CTA(전화 없을 때 from-links 모드) */
const REVENUE_LINKS: Record<RevenueCardTemplateId, LinkDef[]> = {
  "car-wash": [
    { label: "바로 예약하기", type: "website", url: "https://booking.naver.com/" },
    { label: "카카오톡 상담", type: "kakao", url: "https://open.kakao.com/o/linko-sample" },
    { label: "위치 보기", type: "website", url: "https://www.google.com/maps/search/?api=1&query=%EC%84%9C%EC%9A%B8+%EC%84%B8%EC%B0%A8" },
    { label: "전화 걸기", type: "phone", url: "tel:010-1234-5678" },
  ],
  restaurant: [
    { label: "지금 주문하기", type: "website", url: "https://www.baemin.com/" },
    { label: "전화 주문", type: "phone", url: "tel:010-2345-6789" },
    { label: "배달 앱으로 보기", type: "website", url: "https://www.yogiyo.co.kr/" },
    { label: "리뷰·별점 보기", type: "website", url: "https://map.naver.com/" },
  ],
  interior: [
    { label: "무료 견적 받기", type: "phone", url: "tel:010-3456-7890" },
    { label: "상담 신청 (카톡)", type: "kakao", url: "https://open.kakao.com/o/linko-sample" },
    { label: "시공 전후 보기", type: "website", url: "https://www.instagram.com/" },
    { label: "포트폴리오", type: "website", url: "https://linko.app" },
  ],
  salon: [
    { label: "지금 예약하기", type: "website", url: "https://booking.naver.com/" },
    { label: "전화 예약", type: "phone", url: "tel:010-4567-8901" },
    { label: "스타일 사진", type: "website", url: "https://www.instagram.com/" },
    { label: "가격표 보기", type: "website", url: "https://linko.app" },
  ],
  "online-sales": [
    { label: "지금 구매하기", type: "website", url: "https://smartstore.naver.com/" },
    { label: "카카오 문의", type: "kakao", url: "https://open.kakao.com/o/linko-sample" },
    { label: "상품 더 보기", type: "website", url: "https://linko.app" },
    { label: "교환·환불 안내", type: "website", url: "https://linko.app/pricing" },
  ],
};

const IMG = {
  car: "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?w=1200&q=80",
  car2: "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=1200&q=80",
  food: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80",
  food2: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80",
  interior: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80",
  interior2: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&q=80",
  salon: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=80",
  shop: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1200&q=80",
};

function galleryLines(...urls: string[]) {
  return urls.join("\n");
}

export function parseRevenueTemplateSearch(search: string): RevenueCardTemplateId | null {
  const raw = new URLSearchParams(search).get("template")?.trim().toLowerCase();
  if (!raw) return null;
  return REVENUE_CARD_TEMPLATE_IDS.includes(raw as RevenueCardTemplateId) ? (raw as RevenueCardTemplateId) : null;
}

function slugSuffix(): string {
  try {
    return crypto.randomUUID().slice(0, 8);
  } catch {
    return String(Date.now()).slice(-6);
  }
}

type DraftCtx = { person_name: string; email: string };

export function buildRevenueCardDraft(templateId: RevenueCardTemplateId, ctx: DraftCtx): CardEditorDraft {
  const suf = slugSuffix();
  const base = createEmptyDraft({
    person_name: ctx.person_name,
    email: ctx.email ?? "",
    phone: "",
    is_public: true,
    theme: "midnight",
    card_type: "store",
    design_type: "business",
  });

  const packs: Record<RevenueCardTemplateId, Partial<CardEditorDraft>> = {
    "car-wash": {
      slug: `car-wash-${suf}`,
      brand_name: "우리 동네 세차",
      job_title: "대표",
      tagline: "지금 바로 맡길 수 있는 세차장",
      intro: "전·후 사진으로 결과 확인.\n예약은 버튼 한 번.",
      trust_metric: "이번 달 방문 500+",
      gallery_urls_raw: galleryLines(IMG.car, IMG.car2),
      trust_testimonials: [
        { quote: "15분 만에 깔끔해졌어요.", person_name: "방문 고객", role: "리뷰" },
        { quote: "", person_name: "", role: "" },
      ],
      services: [
        { title: "전·후 사진", body: "작업 전후를 바로 확인하세요." },
        { title: "위치·찾아오기", body: "내비게이션 연결." },
        { title: "빠른 상담", body: "카톡·전화 즉시 연결." },
      ],
      brand_image_url: IMG.car,
      imageUrl: IMG.car,
    },
    restaurant: {
      slug: `restaurant-${suf}`,
      brand_name: "우리 동네 식당",
      job_title: "사장님",
      tagline: "지금 바로 주문 가능",
      intro: "대표 메뉴·리뷰 확인 후 바로 주문하세요.",
      trust_metric: "평점 4.8 · 리뷰 1,200+",
      gallery_urls_raw: galleryLines(IMG.food, IMG.food2, IMG.car),
      trust_testimonials: [
        { quote: "배달도 빠르고 맛있어요!", person_name: "단골 손님", role: "리뷰" },
        { quote: "양도 많아요.", person_name: "첫 방문", role: "리뷰" },
      ],
      services: [
        { title: "대표 메뉴 A", body: "시그니처 한 접시." },
        { title: "대표 메뉴 B", body: "단골 추천 메뉴." },
        { title: "대표 메뉴 C", body: "사장님 추천 세트." },
      ],
      brand_image_url: IMG.food,
      imageUrl: IMG.food,
    },
    interior: {
      slug: `interior-${suf}`,
      brand_name: "OO 인테리어",
      job_title: "시공 팀",
      tagline: "시공 사례로 확인하세요",
      intro: "전·후 사진으로 결과를 먼저 보세요.\n견적은 무료입니다.",
      trust_metric: "누적 시공 300+",
      gallery_urls_raw: galleryLines(IMG.interior, IMG.interior2),
      trust_testimonials: [
        { quote: "일정 맞춰 깔끔하게 마감됐어요.", person_name: "아파트 고객", role: "후기" },
        { quote: "", person_name: "", role: "" },
      ],
      services: [
        { title: "전·후 공개", body: "실제 현장 사진으로 증명합니다." },
        { title: "무료 견적", body: "방문 상담 가능." },
        { title: "AS 안내", body: "시공 후 책임 피드백." },
      ],
      brand_image_url: IMG.interior,
      imageUrl: IMG.interior,
    },
    salon: {
      slug: `salon-${suf}`,
      brand_name: "OO 헤어",
      job_title: "디자이너",
      tagline: "오늘 예약 가능한 시간 있습니다",
      intro: "스타일 컷·가격 확인 후 예약하세요.",
      trust_metric: "재방문율 72%",
      gallery_urls_raw: galleryLines(IMG.salon, IMG.interior2),
      trust_testimonials: [
        { quote: "상담 친절하고 결과 만족!", person_name: "방문 고객", role: "후기" },
        { quote: "", person_name: "", role: "" },
      ],
      services: [
        { title: "커트", body: "¥35,000~" },
        { title: "염색", body: "¥80,000~" },
        { title: "케어 패키지", body: "¥120,000~" },
      ],
      brand_image_url: IMG.salon,
      imageUrl: IMG.salon,
    },
    "online-sales": {
      slug: `shop-${suf}`,
      brand_name: "OO 스토어",
      job_title: "운영",
      tagline: "지금 바로 구매 가능",
      intro: "상품 이미지·가격 확인 후 링크에서 구매하세요.",
      trust_metric: "누적 주문 8,000건",
      gallery_urls_raw: galleryLines(IMG.shop, IMG.salon),
      trust_testimonials: [
        { quote: "배송 빠르고 포장 꼼꼼해요.", person_name: "구매자", role: "후기" },
        { quote: "", person_name: "", role: "" },
      ],
      services: [
        { title: "상품 A", body: "¥29,000 · 재고 있음" },
        { title: "상품 B", body: "¥39,000 · 한정" },
        { title: "묶음 할인", body: "2개 이상 추가 할인" },
      ],
      brand_image_url: IMG.shop,
      imageUrl: IMG.shop,
    },
  };

  return mergeDraftDefaults({
    ...base,
    ...packs[templateId],
  });
}

export function buildRevenueTemplateLinkRows(templateId: RevenueCardTemplateId): Array<{
  id: string;
  label: string;
  type: CardLinkType;
  url: string;
}> {
  const defs = REVENUE_LINKS[templateId];
  return defs.map((d, i) => row(`${templateId}-${i}`, d));
}
