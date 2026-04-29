import type { CardEditorDraft } from "@/stores/cardEditorDraftStore";
import { createEmptyDraft, mergeDraftDefaults } from "@/stores/cardEditorDraftStore";
import type { CardLinkType } from "@/types/domain";

export type RevenueCardTemplateId =
  | "car-wash"
  | "restaurant"
  | "interior"
  | "salon"
  | "online-sales"
  | "real-estate"
  | "academy"
  | "fitness-pt"
  | "auto-repair"
  | "cleaning"
  | "delivery-food"
  | "freelancer"
  | "photo-studio"
  | "moving-truck"
  | "resale"
  | "flower-shop"
  | "cafe"
  | "pet-grooming"
  | "nail-shop"
  | "pilates-yoga"
  | "tutoring-visit"
  | "insurance-agent"
  | "finance-consult"
  | "vehicle-rent"
  | "used-car-sales"
  | "onsite-service"
  | "photo-retouch"
  | "video-production"
  | "blog-marketing"
  | "event-planning"
  | "music-lesson"
  | "wedding"
  | "travel-tour"
  | "translation"
  | "legal-tax";

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
  "real-estate",
  "academy",
  "fitness-pt",
  "auto-repair",
  "cleaning",
  "delivery-food",
  "freelancer",
  "photo-studio",
  "moving-truck",
  "resale",
  "flower-shop",
  "cafe",
  "pet-grooming",
  "nail-shop",
  "pilates-yoga",
  "tutoring-visit",
  "insurance-agent",
  "finance-consult",
  "vehicle-rent",
  "used-car-sales",
  "onsite-service",
  "photo-retouch",
  "video-production",
  "blog-marketing",
  "event-planning",
  "music-lesson",
  "wedding",
  "travel-tour",
  "translation",
  "legal-tax",
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
  {
    id: "real-estate",
    label: "부동산",
    emoji: "🏢",
    hook: "매물·위치·가격 한눈에",
    bullets: ["매물 사진", "위치", "가격·상담"],
    primaryCta: "매물 문의하기 →",
  },
  {
    id: "academy",
    label: "학원·과외",
    emoji: "📚",
    hook: "과목·방식·후기까지",
    bullets: ["과목", "수업 방식", "후기"],
    primaryCta: "무료 상담 받기 →",
  },
  {
    id: "fitness-pt",
    label: "헬스·PT",
    emoji: "💪",
    hook: "Before / After 중심",
    bullets: ["전후 사진", "프로그램", "상담"],
    primaryCta: "체험 신청 →",
  },
  {
    id: "auto-repair",
    label: "자동차 정비",
    emoji: "🔧",
    hook: "항목·가격 바로 확인",
    bullets: ["정비 항목", "가격 안내", "전화"],
    primaryCta: "지금 예약 →",
  },
  {
    id: "cleaning",
    label: "청소·입주청소",
    emoji: "✨",
    hook: "전후·범위 한 장에",
    bullets: ["전/후 사진", "서비스 범위", "상담"],
    primaryCta: "견적 받기 →",
  },
  {
    id: "delivery-food",
    label: "배달·음식(소상공)",
    emoji: "🥡",
    hook: "메뉴·가격·주문 한 번에",
    bullets: ["메뉴 이미지", "가격", "주문"],
    primaryCta: "지금 주문 →",
  },
  {
    id: "freelancer",
    label: "프리랜서",
    emoji: "💼",
    hook: "포트폴리오가 신뢰",
    bullets: ["포트폴리오", "작업 분야", "상담"],
    primaryCta: "의뢰하기 →",
  },
  {
    id: "photo-studio",
    label: "촬영·스튜디오",
    emoji: "📷",
    hook: "샘플·가격 투명하게",
    bullets: ["촬영 샘플", "가격", "예약"],
    primaryCta: "촬영 예약 →",
  },
  {
    id: "moving-truck",
    label: "이사·용달",
    emoji: "🚚",
    hook: "차량·요금 바로 안내",
    bullets: ["차량 정보", "가격", "연락"],
    primaryCta: "문의하기 →",
  },
  {
    id: "resale",
    label: "중고·개인판매",
    emoji: "🏷️",
    hook: "사진·가격·연락만으로",
    bullets: ["상품 이미지", "가격", "연락"],
    primaryCta: "구매 문의 →",
  },
  {
    id: "flower-shop",
    label: "꽃집",
    emoji: "💐",
    hook: "꽃 사진·가격·주문 한 번에",
    bullets: ["꽃 사진", "가격", "주문"],
    primaryCta: "지금 주문하기 →",
  },
  {
    id: "cafe",
    label: "카페",
    emoji: "☕",
    hook: "메뉴·위치·방문 연결",
    bullets: ["대표 메뉴", "위치", "주문"],
    primaryCta: "매장 방문하기 →",
  },
  {
    id: "pet-grooming",
    label: "반려동물 미용",
    emoji: "🐕",
    hook: "전후·가격·예약 중심",
    bullets: ["전/후 사진", "가격", "예약"],
    primaryCta: "예약하기 →",
  },
  {
    id: "nail-shop",
    label: "네일샵",
    emoji: "💅",
    hook: "디자인·가격·예약",
    bullets: ["디자인 사진", "가격", "예약"],
    primaryCta: "지금 예약 →",
  },
  {
    id: "pilates-yoga",
    label: "필라테스·요가",
    emoji: "🧘",
    hook: "수업 사진·프로그램·체험",
    bullets: ["수업 사진", "프로그램 안내", "상담"],
    primaryCta: "체험 신청 →",
  },
  {
    id: "tutoring-visit",
    label: "학습지·방문교육",
    emoji: "📖",
    hook: "과목·대상·상담 연결",
    bullets: ["과목", "대상", "상담"],
    primaryCta: "무료 상담 →",
  },
  {
    id: "insurance-agent",
    label: "보험 설계사",
    emoji: "🛡️",
    hook: "분야별 상담 신청",
    bullets: ["상담 분야", "상담 버튼"],
    primaryCta: "상담 신청 →",
  },
  {
    id: "finance-consult",
    label: "대출·금융 상담",
    emoji: "💹",
    hook: "상품 안내·즉시 상담",
    bullets: ["상품 안내", "상담 버튼"],
    primaryCta: "상담하기 →",
  },
  {
    id: "vehicle-rent",
    label: "차량 렌트·리스",
    emoji: "🚙",
    hook: "차량·가격·문의",
    bullets: ["차량 리스트", "가격", "상담"],
    primaryCta: "문의하기 →",
  },
  {
    id: "used-car-sales",
    label: "중고차 판매",
    emoji: "🚘",
    hook: "차량·가격·문의",
    bullets: ["차량 이미지", "가격", "상담"],
    primaryCta: "차량 문의 →",
  },
  {
    id: "onsite-service",
    label: "출장 서비스",
    emoji: "🔧",
    hook: "서비스 목록·즉시 연결",
    bullets: ["서비스 목록", "전화 버튼"],
    primaryCta: "지금 요청 →",
  },
  {
    id: "photo-retouch",
    label: "사진 보정·디자인",
    emoji: "🖼️",
    hook: "작업 예시·의뢰",
    bullets: ["작업 예시", "상담 버튼"],
    primaryCta: "작업 의뢰 →",
  },
  {
    id: "video-production",
    label: "유튜브·영상 제작",
    emoji: "🎬",
    hook: "포트폴리오·제작 문의",
    bullets: ["포트폴리오", "상담 버튼"],
    primaryCta: "제작 문의 →",
  },
  {
    id: "blog-marketing",
    label: "블로그 마케팅",
    emoji: "📈",
    hook: "사례·상담 한 장에",
    bullets: ["사례", "상담 버튼"],
    primaryCta: "문의하기 →",
  },
  {
    id: "event-planning",
    label: "행사·이벤트",
    emoji: "🎉",
    hook: "진행 사례·행사 문의",
    bullets: ["진행 사례", "상담 버튼"],
    primaryCta: "행사 문의 →",
  },
  {
    id: "music-lesson",
    label: "악기 레슨",
    emoji: "🎹",
    hook: "레슨 영상·신청",
    bullets: ["레슨 영상", "상담 버튼"],
    primaryCta: "레슨 신청 →",
  },
  {
    id: "wedding",
    label: "결혼·웨딩",
    emoji: "💒",
    hook: "사례·상담 예약",
    bullets: ["사례", "상담 버튼"],
    primaryCta: "상담 예약 →",
  },
  {
    id: "travel-tour",
    label: "여행·투어",
    emoji: "✈️",
    hook: "상품·가격·예약",
    bullets: ["여행 상품", "가격", "예약"],
    primaryCta: "예약하기 →",
  },
  {
    id: "translation",
    label: "번역·통역",
    emoji: "🌐",
    hook: "언어별 빠른 의뢰",
    bullets: ["언어", "상담 버튼"],
    primaryCta: "번역 문의 →",
  },
  {
    id: "legal-tax",
    label: "법률·세무 상담",
    emoji: "⚖️",
    hook: "분야별 전문 상담",
    bullets: ["분야", "상담 버튼"],
    primaryCta: "상담 예약 →",
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
  "real-estate": [
    { label: "매물 문의하기", type: "kakao", url: "https://open.kakao.com/o/linko-sample" },
    { label: "전화 문의", type: "phone", url: "tel:010-2222-3333" },
    { label: "매물 사진 더 보기", type: "website", url: "https://www.instagram.com/" },
    { label: "위치·학군 안내", type: "website", url: "https://map.naver.com/" },
  ],
  academy: [
    { label: "무료 상담 받기", type: "kakao", url: "https://open.kakao.com/o/linko-sample" },
    { label: "전화 상담", type: "phone", url: "tel:010-3333-4444" },
    { label: "수업 시간표", type: "website", url: "https://linko.app" },
    { label: "후기 더 보기", type: "website", url: "https://linko.app" },
  ],
  "fitness-pt": [
    { label: "체험 신청", type: "website", url: "https://booking.naver.com/" },
    { label: "카카오 상담", type: "kakao", url: "https://open.kakao.com/o/linko-sample" },
    { label: "전후 사진 보기", type: "website", url: "https://www.instagram.com/" },
    { label: "전화 문의", type: "phone", url: "tel:010-4444-5555" },
  ],
  "auto-repair": [
    { label: "지금 예약", type: "phone", url: "tel:010-5555-6666" },
    { label: "카카오로 예약", type: "kakao", url: "https://open.kakao.com/o/linko-sample" },
    { label: "정비 항목·가격표", type: "website", url: "https://linko.app" },
    { label: "위치·영업시간", type: "website", url: "https://map.naver.com/" },
  ],
  cleaning: [
    { label: "견적 받기", type: "kakao", url: "https://open.kakao.com/o/linko-sample" },
    { label: "전화 문의", type: "phone", url: "tel:010-6666-7777" },
    { label: "전후 사진 더 보기", type: "website", url: "https://www.instagram.com/" },
    { label: "서비스 범위 안내", type: "website", url: "https://linko.app" },
  ],
  "delivery-food": [
    { label: "지금 주문", type: "website", url: "https://www.baemin.com/" },
    { label: "카카오 주문", type: "kakao", url: "https://open.kakao.com/o/linko-sample" },
    { label: "전화 주문", type: "phone", url: "tel:010-7777-8888" },
    { label: "메뉴판 PDF", type: "website", url: "https://linko.app" },
  ],
  freelancer: [
    { label: "의뢰하기", type: "kakao", url: "https://open.kakao.com/o/linko-sample" },
    { label: "포트폴리오 보기", type: "website", url: "https://linko.app" },
    { label: "이메일 보내기", type: "email", url: "mailto:hello@linko.app" },
    { label: "견적 요청", type: "phone", url: "tel:010-8888-9999" },
  ],
  "photo-studio": [
    { label: "촬영 예약", type: "website", url: "https://booking.naver.com/" },
    { label: "카카오 예약", type: "kakao", url: "https://open.kakao.com/o/linko-sample" },
    { label: "샘플 갤러리", type: "website", url: "https://www.instagram.com/" },
    { label: "전화 문의", type: "phone", url: "tel:010-9999-0000" },
  ],
  "moving-truck": [
    { label: "문의하기", type: "phone", url: "tel:010-1212-3434" },
    { label: "카카오 견적", type: "kakao", url: "https://open.kakao.com/o/linko-sample" },
    { label: "차량·요금 안내", type: "website", url: "https://linko.app" },
    { label: "위치 확인", type: "website", url: "https://map.naver.com/" },
  ],
  resale: [
    { label: "구매 문의", type: "kakao", url: "https://open.kakao.com/o/linko-sample" },
    { label: "문자 보내기", type: "phone", url: "tel:010-5656-7878" },
    { label: "상품 사진 더 보기", type: "website", url: "https://www.instagram.com/" },
    { label: "직거래 장소", type: "website", url: "https://map.naver.com/" },
  ],
  "flower-shop": [
    { label: "지금 주문하기", type: "website", url: "https://smartstore.naver.com/" },
    { label: "카카오로 주문", type: "kakao", url: "https://open.kakao.com/o/linko-sample" },
    { label: "오늘 픽업·배송 안내", type: "website", url: "https://linko.app" },
    { label: "매장 위치", type: "website", url: "https://map.naver.com/" },
  ],
  cafe: [
    { label: "매장 방문하기", type: "website", url: "https://map.naver.com/" },
    { label: "지금 주문", type: "website", url: "https://www.baemin.com/" },
    { label: "대표 메뉴 보기", type: "website", url: "https://www.instagram.com/" },
    { label: "전화 문의", type: "phone", url: "tel:010-3030-4040" },
  ],
  "pet-grooming": [
    { label: "예약하기", type: "website", url: "https://booking.naver.com/" },
    { label: "카카오 예약", type: "kakao", url: "https://open.kakao.com/o/linko-sample" },
    { label: "전후 사진 보기", type: "website", url: "https://www.instagram.com/" },
    { label: "전화 예약", type: "phone", url: "tel:010-4141-5252" },
  ],
  "nail-shop": [
    { label: "지금 예약", type: "website", url: "https://booking.naver.com/" },
    { label: "카카오 예약", type: "kakao", url: "https://open.kakao.com/o/linko-sample" },
    { label: "디자인 갤러리", type: "website", url: "https://www.instagram.com/" },
    { label: "전화 문의", type: "phone", url: "tel:010-5252-6363" },
  ],
  "pilates-yoga": [
    { label: "체험 신청", type: "website", url: "https://booking.naver.com/" },
    { label: "상담 (카톡)", type: "kakao", url: "https://open.kakao.com/o/linko-sample" },
    { label: "수업 사진 보기", type: "website", url: "https://www.instagram.com/" },
    { label: "전화 문의", type: "phone", url: "tel:010-6363-7474" },
  ],
  "tutoring-visit": [
    { label: "무료 상담", type: "kakao", url: "https://open.kakao.com/o/linko-sample" },
    { label: "전화 상담", type: "phone", url: "tel:010-7474-8585" },
    { label: "과목·대상 안내", type: "website", url: "https://linko.app" },
    { label: "후기 더 보기", type: "website", url: "https://linko.app" },
  ],
  "insurance-agent": [
    { label: "상담 신청", type: "kakao", url: "https://open.kakao.com/o/linko-sample" },
    { label: "전화 상담", type: "phone", url: "tel:010-8585-9696" },
    { label: "상담 분야 안내", type: "website", url: "https://linko.app" },
    { label: "약관·유의사항", type: "website", url: "https://linko.app/pricing" },
  ],
  "finance-consult": [
    { label: "상담하기", type: "kakao", url: "https://open.kakao.com/o/linko-sample" },
    { label: "전화 상담", type: "phone", url: "tel:010-9696-0707" },
    { label: "상품 안내", type: "website", url: "https://linko.app" },
    { label: "필요 서류 안내", type: "website", url: "https://linko.app" },
  ],
  "vehicle-rent": [
    { label: "문의하기", type: "phone", url: "tel:010-0707-1818" },
    { label: "카카오 견적", type: "kakao", url: "https://open.kakao.com/o/linko-sample" },
    { label: "차량 리스트", type: "website", url: "https://linko.app" },
    { label: "위치·영업시간", type: "website", url: "https://map.naver.com/" },
  ],
  "used-car-sales": [
    { label: "차량 문의", type: "kakao", url: "https://open.kakao.com/o/linko-sample" },
    { label: "전화 문의", type: "phone", url: "tel:010-1818-2929" },
    { label: "차량 목록", type: "website", url: "https://linko.app" },
    { label: "매장 위치", type: "website", url: "https://map.naver.com/" },
  ],
  "onsite-service": [
    { label: "지금 요청", type: "phone", url: "tel:010-2929-3838" },
    { label: "카카오 긴급", type: "kakao", url: "https://open.kakao.com/o/linko-sample" },
    { label: "서비스 목록", type: "website", url: "https://linko.app" },
    { label: "출장 가능 지역", type: "website", url: "https://map.naver.com/" },
  ],
  "photo-retouch": [
    { label: "작업 의뢰", type: "kakao", url: "https://open.kakao.com/o/linko-sample" },
    { label: "포트폴리오", type: "website", url: "https://linko.app" },
    { label: "이메일 견적", type: "email", url: "mailto:hello@linko.app" },
    { label: "전화 문의", type: "phone", url: "tel:010-3838-4949" },
  ],
  "video-production": [
    { label: "제작 문의", type: "kakao", url: "https://open.kakao.com/o/linko-sample" },
    { label: "포트폴리오 영상", type: "youtube", url: "https://www.youtube.com/" },
    { label: "견적 요청", type: "phone", url: "tel:010-4949-5050" },
    { label: "작업 프로세스", type: "website", url: "https://linko.app" },
  ],
  "blog-marketing": [
    { label: "문의하기", type: "kakao", url: "https://open.kakao.com/o/linko-sample" },
    { label: "진행 사례", type: "website", url: "https://linko.app" },
    { label: "전화 상담", type: "phone", url: "tel:010-5050-6161" },
    { label: "상담 신청 폼", type: "website", url: "https://linko.app" },
  ],
  "event-planning": [
    { label: "행사 문의", type: "kakao", url: "https://open.kakao.com/o/linko-sample" },
    { label: "진행 사례", type: "website", url: "https://www.instagram.com/" },
    { label: "전화 문의", type: "phone", url: "tel:010-6161-7272" },
    { label: "행사 유형 안내", type: "website", url: "https://linko.app" },
  ],
  "music-lesson": [
    { label: "레슨 신청", type: "kakao", url: "https://open.kakao.com/o/linko-sample" },
    { label: "레슨 영상", type: "youtube", url: "https://www.youtube.com/" },
    { label: "시간표·레벨", type: "website", url: "https://linko.app" },
    { label: "전화 문의", type: "phone", url: "tel:010-7272-8383" },
  ],
  wedding: [
    { label: "상담 예약", type: "kakao", url: "https://open.kakao.com/o/linko-sample" },
    { label: "포트폴리오", type: "website", url: "https://www.instagram.com/" },
    { label: "전화 상담", type: "phone", url: "tel:010-8383-9494" },
    { label: "오시는 길", type: "website", url: "https://map.naver.com/" },
  ],
  "travel-tour": [
    { label: "예약하기", type: "website", url: "https://linko.app" },
    { label: "카카오 상담", type: "kakao", url: "https://open.kakao.com/o/linko-sample" },
    { label: "여행 상품·가격", type: "website", url: "https://linko.app" },
    { label: "전화 예약", type: "phone", url: "tel:010-9494-0505" },
  ],
  translation: [
    { label: "번역 문의", type: "kakao", url: "https://open.kakao.com/o/linko-sample" },
    { label: "이메일 견적", type: "email", url: "mailto:translate@linko.app" },
    { label: "언어·분야 안내", type: "website", url: "https://linko.app" },
    { label: "전화 문의", type: "phone", url: "tel:010-0505-1616" },
  ],
  "legal-tax": [
    { label: "상담 예약", type: "kakao", url: "https://open.kakao.com/o/linko-sample" },
    { label: "전화 예약", type: "phone", url: "tel:010-1616-2727" },
    { label: "분야 안내", type: "website", url: "https://linko.app" },
    { label: "자료 제출 안내", type: "website", url: "https://linko.app" },
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
  estate: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80",
  estate2: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
  academy: "https://images.unsplash.com/photo-1503676260728-1c00da094ec0?w=1200&q=80",
  academy2: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&q=80",
  gym: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80",
  gym2: "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=1200&q=80",
  mechanic: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=1200&q=80",
  mechanic2: "https://images.unsplash.com/photo-1625047509248-ec889cbdf17f?w=1200&q=80",
  cleaning: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&q=80",
  cleaning2: "https://images.unsplash.com/photo-1563453397332-03533986e813?w=1200&q=80",
  takeaway: "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=1200&q=80",
  takeaway2: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1200&q=80",
  freelance: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80",
  freelance2: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&q=80",
  studio: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200&q=80",
  studio2: "https://images.unsplash.com/photo-1492691527719-9d1e07cb534b?w=1200&q=80",
  truck: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=80",
  truck2: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=1200&q=80",
  resale: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80",
  resale2: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80",
  flower1: "https://images.unsplash.com/photo-1562690868-60bbe729a539?w=1200&q=80",
  flower2: "https://images.unsplash.com/photo-1455659817273-f968077798a8?w=1200&q=80",
  cafe1: "https://images.unsplash.com/photo-1501339847302-ac426a4c7cbb?w=1200&q=80",
  cafe2: "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=1200&q=80",
  petGroom1: "https://images.unsplash.com/photo-1587300007628-6152f79e9e55?w=1200&q=80",
  petGroom2: "https://images.unsplash.com/photo-1516734212186-967837cd9c30?w=1200&q=80",
  nail1: "https://images.unsplash.com/photo-1604654894613-d21bd635854f?w=1200&q=80",
  nail2: "https://images.unsplash.com/photo-1519415943484-f62fe4413482?w=1200&q=80",
  pilates1: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80",
  pilates2: "https://images.unsplash.com/photo-1571902947922-917f58d89dbc?w=1200&q=80",
  tutoring1: "https://images.unsplash.com/photo-1503676260728-1c00da094ec0?w=1200&q=80",
  tutoring2: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&q=80",
  insurance1: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&q=80",
  insurance2: "https://images.unsplash.com/photo-1560472355-536de396f311?w=1200&q=80",
  finance1: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=80",
  finance2: "https://images.unsplash.com/photo-1579621970563-ebec7560ff0e?w=1200&q=80",
  vehRent1: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&q=80",
  vehRent2: "https://images.unsplash.com/photo-1494976388531-dedf85529240?w=1200&q=80",
  usedCar1: "https://images.unsplash.com/photo-1560958089-b8ae9789c093?w=1200&q=80",
  usedCar2: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&q=80",
  onsite1: "https://images.unsplash.com/photo-1621905923243-aa63ccfb751e?w=1200&q=80",
  onsite2: "https://images.unsplash.com/photo-1581577945267-897dbe27eb12?w=1200&q=80",
  retouch1: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&q=80",
  retouch2: "https://images.unsplash.com/photo-1499951366624-f76e24902876?w=1200&q=80",
  videoProd1: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1200&q=80",
  videoProd2: "https://images.unsplash.com/photo-1492691527719-9d1e07cb534b?w=1200&q=80",
  blogMkt1: "https://images.unsplash.com/photo-1499756638867-bd23fedcbaaa?w=1200&q=80",
  blogMkt2: "https://images.unsplash.com/photo-1432888498269-38bf4dad5712?w=1200&q=80",
  eventPlan1: "https://images.unsplash.com/photo-1478146896981-b80fe7ff3095?w=1200&q=80",
  eventPlan2: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1200&q=80",
  musicLesson1: "https://images.unsplash.com/photo-1520523839897-bd8b52f05aed?w=1200&q=80",
  musicLesson2: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1200&q=80",
  wedding1: "https://images.unsplash.com/photo-1519744346967-fbd948934425?w=1200&q=80",
  wedding2: "https://images.unsplash.com/photo-1469371670557-44fe746232da?w=1200&q=80",
  travel1: "https://images.unsplash.com/photo-1469474968028-56623f08e8da?w=1200&q=80",
  travel2: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80",
  translation1: "https://images.unsplash.com/photo-1546410535-b31dff7b3dc7?w=1200&q=80",
  translation2: "https://images.unsplash.com/photo-1456513080510-7bbe3c741811?w=1200&q=80",
  legalTax1: "https://images.unsplash.com/photo-1589829545826-10fac696fd69?w=1200&q=80",
  legalTax2: "https://images.unsplash.com/photo-1454165804606-c868d81bd902?w=1200&q=80",
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
    "real-estate": {
      slug: `real-estate-${suf}`,
      brand_name: "OO 공인중개사",
      job_title: "매물 담당",
      tagline: "지금 바로 확인 가능한 매물",
      intro: "매물 사진·위치·가격을 한곳에.\n상담 버튼으로 바로 연결됩니다.",
      trust_metric: "이번 주 신규 매물 12건",
      gallery_urls_raw: galleryLines(IMG.estate, IMG.estate2),
      trust_testimonials: [
        { quote: "원하는 조건 빠르게 찾아주셨어요.", person_name: "실거주 고객", role: "후기" },
        { quote: "상담이 친절했습니다.", person_name: "문의 고객", role: "후기" },
      ],
      services: [
        { title: "매물 사진", body: "실내·외 대표 컷." },
        { title: "위치·역세권", body: "지도·학군 요약." },
        { title: "가격·조건", body: "실거래·관리비 안내." },
      ],
      brand_image_url: IMG.estate,
      imageUrl: IMG.estate,
    },
    academy: {
      slug: `academy-${suf}`,
      brand_name: "OO 학원",
      job_title: "원장",
      tagline: "지금 상담 가능",
      intro: "과목·수업 방식·후기 확인 후 무료 상담 신청.",
      trust_metric: "수강생 만족도 4.9",
      gallery_urls_raw: galleryLines(IMG.academy, IMG.academy2),
      trust_testimonials: [
        { quote: "커리큘럼이 체계적이에요.", person_name: "학부모", role: "후기" },
        { quote: "성적이 올랐어요.", person_name: "수강생", role: "후기" },
      ],
      services: [
        { title: "대표 과목", body: "수학·영어·논술 등 선택." },
        { title: "수업 방식", body: "1:1 · 소그룹 · 온라인." },
        { title: "후기", body: "실제 수강생 피드백." },
      ],
      brand_image_url: IMG.academy,
      imageUrl: IMG.academy,
    },
    "fitness-pt": {
      slug: `fitness-pt-${suf}`,
      brand_name: "OO PT 스튜디오",
      job_title: "트레이너",
      tagline: "지금 시작하면 달라집니다",
      intro: "Before / After와 프로그램 소개.\n체험 신청으로 시작하세요.",
      trust_metric: "회원 유지율 82%",
      gallery_urls_raw: galleryLines(IMG.gym, IMG.gym2),
      trust_testimonials: [
        { quote: "체형이 확 달라졌어요.", person_name: "회원", role: "후기" },
        { quote: "관리 꼼꼼해요.", person_name: "회원", role: "후기" },
      ],
      services: [
        { title: "Before / After", body: "실제 회원 전후 사진." },
        { title: "프로그램", body: "다이어트 · 근력 · 재활." },
        { title: "체험·상담", body: "첫 방문 체형 분석." },
      ],
      brand_image_url: IMG.gym,
      imageUrl: IMG.gym,
    },
    "auto-repair": {
      slug: `auto-repair-${suf}`,
      brand_name: "OO 자동차 정비소",
      job_title: "정비 팀",
      tagline: "오늘 바로 점검 가능합니다",
      intro: "정비 항목·가격 간단 안내.\n전화 한 번으로 예약됩니다.",
      trust_metric: "당일 점검 가능 요일 안내",
      gallery_urls_raw: galleryLines(IMG.mechanic, IMG.mechanic2),
      trust_testimonials: [
        { quote: "견적 투명하고 빨라요.", person_name: "방문 고객", role: "후기" },
        { quote: "", person_name: "", role: "" },
      ],
      services: [
        { title: "정비 항목", body: "엔진·브레이크·타이어 등." },
        { title: "가격 안내", body: "기본 점검 · 부품 별도 안내." },
        { title: "예약·문의", body: "전화 우선 연결." },
      ],
      brand_image_url: IMG.mechanic,
      imageUrl: IMG.mechanic,
    },
    cleaning: {
      slug: `cleaning-${suf}`,
      brand_name: "OO 입주청소",
      job_title: "매니저",
      tagline: "집을 새집처럼",
      intro: "전·후 사진과 서비스 범위 확인 후 견적 요청.",
      trust_metric: "누적 현장 2,000+",
      gallery_urls_raw: galleryLines(IMG.cleaning, IMG.cleaning2),
      trust_testimonials: [
        { quote: "모서리까지 깔끔했어요.", person_name: "입주 고객", role: "후기" },
        { quote: "일정 맞춰 완료!", person_name: "계약 고객", role: "후기" },
      ],
      services: [
        { title: "전·후 사진", body: "현장 전후 비교." },
        { title: "서비스 범위", body: "입주 · 이사 · 상업." },
        { title: "견적 상담", body: "평수·일정 기준." },
      ],
      brand_image_url: IMG.cleaning,
      imageUrl: IMG.cleaning,
    },
    "delivery-food": {
      slug: `delivery-food-${suf}`,
      brand_name: "OO 포장·배달",
      job_title: "사장님",
      tagline: "오늘 주문 가능합니다",
      intro: "메뉴 이미지·가격 확인 후 바로 주문하세요.",
      trust_metric: "단골 주문 재구매율 높음",
      gallery_urls_raw: galleryLines(IMG.takeaway, IMG.takeaway2, IMG.food),
      trust_testimonials: [
        { quote: "양 많고 빨라요!", person_name: "주문 고객", role: "후기" },
        { quote: "포장 꼼꼼해요.", person_name: "배달 고객", role: "후기" },
      ],
      services: [
        { title: "대표 메뉴", body: "사진·가격 표기." },
        { title: "가격", body: "배달비·최소 주문 안내." },
        { title: "주문 채널", body: "앱·카톡·전화." },
      ],
      brand_image_url: IMG.takeaway,
      imageUrl: IMG.takeaway,
    },
    freelancer: {
      slug: `freelancer-${suf}`,
      brand_name: "OO 디자인 스튜디오",
      job_title: "프리랜서",
      tagline: "바로 작업 가능합니다",
      intro: "포트폴리오·작업 분야 확인 후 의뢰·상담.",
      trust_metric: "프로젝트 완료 150+",
      gallery_urls_raw: galleryLines(IMG.freelance, IMG.freelance2),
      trust_testimonials: [
        { quote: "일정대로 깔끔하게 전달됐어요.", person_name: "클라이언트", role: "후기" },
        { quote: "소통이 빨라요.", person_name: "스타트업", role: "후기" },
      ],
      services: [
        { title: "포트폴리오", body: "브랜딩 · 웹 · 편집." },
        { title: "작업 분야", body: "디자인 · 개발 협업 가능." },
        { title: "의뢰·상담", body: "견적 후 일정 확정." },
      ],
      brand_image_url: IMG.freelance,
      imageUrl: IMG.freelance,
    },
    "photo-studio": {
      slug: `photo-studio-${suf}`,
      brand_name: "OO 스튜디오",
      job_title: "포토그래퍼",
      tagline: "지금 예약 가능",
      intro: "촬영 샘플·가격 확인 후 예약 버튼으로 확정.",
      trust_metric: "이번 달 잔여 일정 안내",
      gallery_urls_raw: galleryLines(IMG.studio, IMG.studio2),
      trust_testimonials: [
        { quote: "분위기 너무 좋았어요.", person_name: "촬영 고객", role: "후기" },
        { quote: "보정 만족!", person_name: "프로필 고객", role: "후기" },
      ],
      services: [
        { title: "촬영 샘플", body: "프로필 · 제품 · 패밀리." },
        { title: "가격", body: "패키지·추가 컷 안내." },
        { title: "예약", body: "일정·장소 조율." },
      ],
      brand_image_url: IMG.studio,
      imageUrl: IMG.studio,
    },
    "moving-truck": {
      slug: `moving-truck-${suf}`,
      brand_name: "OO 이사·용달",
      job_title: "배차 담당",
      tagline: "오늘 바로 이동 가능",
      intro: "차량 정보·가격 확인 후 전화·카톡으로 문의.",
      trust_metric: "당일 긴급 가능 문의",
      gallery_urls_raw: galleryLines(IMG.truck, IMG.truck2),
      trust_testimonials: [
        { quote: "짐 옮기는 속도가 빨라요.", person_name: "이사 고객", role: "후기" },
        { quote: "요금 설명이 명확했어요.", person_name: "용달 고객", role: "후기" },
      ],
      services: [
        { title: "차량 정보", body: "1톤 · 라보 · 탑차 등." },
        { title: "가격", body: "거리·층수 기준 안내." },
        { title: "연락", body: "전화 우선 응대." },
      ],
      brand_image_url: IMG.truck,
      imageUrl: IMG.truck,
    },
    resale: {
      slug: `resale-${suf}`,
      brand_name: "직거래 판매",
      job_title: "판매자",
      tagline: "지금 바로 구매 가능",
      intro: "상품 이미지·가격·연락처 한곳에.\n구매 문의 버튼으로 연결.",
      trust_metric: "거래 만족 후기",
      gallery_urls_raw: galleryLines(IMG.resale, IMG.resale2),
      trust_testimonials: [
        { quote: "설명과 동일했어요.", person_name: "구매자", role: "거래 후기" },
        { quote: "직거래 편했어요.", person_name: "구매자", role: "거래 후기" },
      ],
      services: [
        { title: "상품 이미지", body: "생활 기스까지 표시." },
        { title: "가격", body: "택포·직거래 선택." },
        { title: "연락", body: "카톡·문자 우선." },
      ],
      brand_image_url: IMG.resale,
      imageUrl: IMG.resale,
    },
    "flower-shop": {
      slug: `flower-shop-${suf}`,
      brand_name: "OO 플라워",
      job_title: "플로리스트",
      tagline: "오늘 바로 꽃 준비 가능합니다",
      intro: "꽃 사진·가격 확인 후 주문 버튼으로 바로 연결.",
      trust_metric: "당일 픽업·배송 문의",
      gallery_urls_raw: galleryLines(IMG.flower1, IMG.flower2),
      trust_testimonials: [
        { quote: "오늘 맞춰 주셔서 감사해요.", person_name: "고객", role: "후기" },
        { quote: "사진 그대로 예뻤어요.", person_name: "고객", role: "후기" },
      ],
      services: [
        { title: "꽃 사진", body: "생화 · 꽃다발 · 화환." },
        { title: "가격", body: "사이즈·구성별 안내." },
        { title: "주문", body: "지금 주문 후 픽업·배송." },
      ],
      brand_image_url: IMG.flower1,
      imageUrl: IMG.flower1,
    },
    cafe: {
      slug: `cafe-${suf}`,
      brand_name: "OO 카페",
      job_title: "매장",
      tagline: "지금 바로 주문 가능",
      intro: "대표 메뉴·위치 확인 후 매장 방문·주문 버튼으로 연결.",
      trust_metric: "오늘 영업 중",
      gallery_urls_raw: galleryLines(IMG.cafe1, IMG.cafe2),
      trust_testimonials: [
        { quote: "메뉴 사진 그대로 나와요.", person_name: "방문객", role: "후기" },
        { quote: "위치 찾기 쉬웠어요.", person_name: "방문객", role: "후기" },
      ],
      services: [
        { title: "대표 메뉴", body: "시즌 음료 · 디저트." },
        { title: "위치", body: "주차·영업시간 안내." },
        { title: "주문", body: "매장·포장 주문." },
      ],
      brand_image_url: IMG.cafe1,
      imageUrl: IMG.cafe1,
    },
    "pet-grooming": {
      slug: `pet-grooming-${suf}`,
      brand_name: "OO 펫 미용",
      job_title: "그루머",
      tagline: "오늘 예약 가능",
      intro: "전·후 사진·가격 확인 후 예약 버튼으로 확정.",
      trust_metric: "오늘 잔여 타임 안내",
      gallery_urls_raw: galleryLines(IMG.petGroom1, IMG.petGroom2),
      trust_testimonials: [
        { quote: "전후 차이가 확실해요.", person_name: "보호자", role: "후기" },
        { quote: "예약이 빨라요.", person_name: "보호자", role: "후기" },
      ],
      services: [
        { title: "전/후 사진", body: "컷 · 목욕 · 클리핑." },
        { title: "가격", body: "체중·종별 안내." },
        { title: "예약", body: "지금 예약 후 방문." },
      ],
      brand_image_url: IMG.petGroom1,
      imageUrl: IMG.petGroom1,
    },
    "nail-shop": {
      slug: `nail-shop-${suf}`,
      brand_name: "OO 네일",
      job_title: "네일 아티스트",
      tagline: "오늘 시술 가능",
      intro: "디자인 사진·가격 확인 후 예약 버튼으로 바로 연결.",
      trust_metric: "오늘 당일 예약 가능",
      gallery_urls_raw: galleryLines(IMG.nail1, IMG.nail2),
      trust_testimonials: [
        { quote: "사진이랑 똑같아요.", person_name: "고객", role: "후기" },
        { quote: "가격 대비 만족!", person_name: "고객", role: "후기" },
      ],
      services: [
        { title: "디자인 사진", body: "젤 · 패디 · 아트." },
        { title: "가격", body: "시술별 안내." },
        { title: "예약", body: "지금 예약 후 방문." },
      ],
      brand_image_url: IMG.nail1,
      imageUrl: IMG.nail1,
    },
    "pilates-yoga": {
      slug: `pilates-yoga-${suf}`,
      brand_name: "OO 필라테스",
      job_title: "강사",
      tagline: "지금 체험 가능합니다",
      intro: "수업 사진·프로그램 확인 후 상담·체험 버튼으로 연결.",
      trust_metric: "이번 주 체험 잔여",
      gallery_urls_raw: galleryLines(IMG.pilates1, IMG.pilates2),
      trust_testimonials: [
        { quote: "오늘부터 시작했어요.", person_name: "회원", role: "후기" },
        { quote: "상담이 친절해요.", person_name: "회원", role: "후기" },
      ],
      services: [
        { title: "수업 사진", body: "그룹 · 개인 · 재활." },
        { title: "프로그램 안내", body: "체험 · 정규 반." },
        { title: "상담", body: "체험 신청 후 일정 확정." },
      ],
      brand_image_url: IMG.pilates1,
      imageUrl: IMG.pilates1,
    },
    "tutoring-visit": {
      slug: `tutoring-visit-${suf}`,
      brand_name: "OO 학습·방문",
      job_title: "선생님",
      tagline: "지금 상담 가능합니다",
      intro: "과목·대상 확인 후 무료 상담 버튼으로 연결.",
      trust_metric: "오늘 상담 슬롯 안내",
      gallery_urls_raw: galleryLines(IMG.tutoring1, IMG.tutoring2),
      trust_testimonials: [
        { quote: "아이 성향에 맞춰 주세요.", person_name: "학부모", role: "후기" },
        { quote: "상담 후 바로 일정 잡았어요.", person_name: "학부모", role: "후기" },
      ],
      services: [
        { title: "과목", body: "국·영·수 · 학습지." },
        { title: "대상", body: "초·중 · 방문 범위." },
        { title: "상담", body: "무료 상담 후 수업 제안." },
      ],
      brand_image_url: IMG.tutoring1,
      imageUrl: IMG.tutoring1,
    },
    "insurance-agent": {
      slug: `insurance-agent-${suf}`,
      brand_name: "OO 보험 설계",
      job_title: "설계사",
      tagline: "내게 맞는 보험 상담",
      intro: "상담 분야 선택 후 상담 신청 버튼으로 바로 연결.",
      trust_metric: "오늘 통화 가능",
      gallery_urls_raw: galleryLines(IMG.insurance1, IMG.insurance2),
      trust_testimonials: [
        { quote: "필요한 것만 짚어 주세요.", person_name: "고객", role: "후기" },
        { quote: "설명이 이해하기 쉬웠어요.", person_name: "고객", role: "후기" },
      ],
      services: [
        { title: "상담 분야", body: "실손 · 종신 · 연금 · 자동차." },
        { title: "상담 방식", body: "카톡 · 전화 · 방문." },
        { title: "상담 신청", body: "지금 신청 후 연락." },
      ],
      brand_image_url: IMG.insurance1,
      imageUrl: IMG.insurance1,
    },
    "finance-consult": {
      slug: `finance-consult-${suf}`,
      brand_name: "OO 금융 상담",
      job_title: "상담사",
      tagline: "지금 바로 상담 가능",
      intro: "상품 안내 확인 후 상담 버튼으로 즉시 연결.",
      trust_metric: "당일 상담 접수",
      gallery_urls_raw: galleryLines(IMG.finance1, IMG.finance2),
      trust_testimonials: [
        { quote: "조건 비교가 한눈에 됐어요.", person_name: "고객", role: "후기" },
        { quote: "바로 연락 왔어요.", person_name: "고객", role: "후기" },
      ],
      services: [
        { title: "상품 안내", body: "주택 · 신용 · 사업자 자금." },
        { title: "준비 서류", body: "간단 체크리스트." },
        { title: "상담", body: "지금 상담 후 진행." },
      ],
      brand_image_url: IMG.finance1,
      imageUrl: IMG.finance1,
    },
    "vehicle-rent": {
      slug: `vehicle-rent-${suf}`,
      brand_name: "OO 렌트카",
      job_title: "영업",
      tagline: "오늘 바로 이용 가능",
      intro: "차량 리스트·가격 확인 후 문의 버튼으로 견적.",
      trust_metric: "당일 출고 문의",
      gallery_urls_raw: galleryLines(IMG.vehRent1, IMG.vehRent2),
      trust_testimonials: [
        { quote: "차량 상태 깔끔했어요.", person_name: "고객", role: "후기" },
        { quote: "요금 설명이 명확해요.", person_name: "고객", role: "후기" },
      ],
      services: [
        { title: "차량 리스트", body: "경차 · SUV · 승합." },
        { title: "가격", body: "일·월 렌트 · 리스." },
        { title: "상담", body: "문의 후 계약." },
      ],
      brand_image_url: IMG.vehRent1,
      imageUrl: IMG.vehRent1,
    },
    "used-car-sales": {
      slug: `used-car-sales-${suf}`,
      brand_name: "OO 중고차",
      job_title: "딜러",
      tagline: "지금 바로 차량 확인",
      intro: "차량 이미지·가격 확인 후 문의 버튼으로 연결.",
      trust_metric: "오늘 방문 예약 가능",
      gallery_urls_raw: galleryLines(IMG.usedCar1, IMG.usedCar2),
      trust_testimonials: [
        { quote: "사진이랑 실차가 같았어요.", person_name: "고객", role: "후기" },
        { quote: "상담이 빨라요.", person_name: "고객", role: "후기" },
      ],
      services: [
        { title: "차량 이미지", body: "외관 · 실내 · 주행거리." },
        { title: "가격", body: "할부·매입 안내." },
        { title: "상담", body: "차량 문의 후 시승." },
      ],
      brand_image_url: IMG.usedCar1,
      imageUrl: IMG.usedCar1,
    },
    "onsite-service": {
      slug: `onsite-service-${suf}`,
      brand_name: "OO 출장 서비스",
      job_title: "현장 기사",
      tagline: "지금 바로 방문 가능",
      intro: "서비스 목록 확인 후 전화·요청 버튼으로 즉시 연결.",
      trust_metric: "당일 출동 가능 지역",
      gallery_urls_raw: galleryLines(IMG.onsite1, IMG.onsite2),
      trust_testimonials: [
        { quote: "예약 후 바로 와 주셨어요.", person_name: "고객", role: "후기" },
        { quote: "작업 깔끔했습니다.", person_name: "고객", role: "후기" },
      ],
      services: [
        { title: "서비스 목록", body: "설치 · 수리 · 점검." },
        { title: "방문", body: "출장 가능 시간대." },
        { title: "전화", body: "지금 요청 후 배정." },
      ],
      brand_image_url: IMG.onsite1,
      imageUrl: IMG.onsite1,
    },
    "photo-retouch": {
      slug: `photo-retouch-${suf}`,
      brand_name: "OO 리터칭",
      job_title: "디자이너",
      tagline: "빠르게 작업 가능합니다",
      intro: "작업 예시 확인 후 의뢰·상담 버튼으로 연결.",
      trust_metric: "오늘 작업 가능 문의",
      gallery_urls_raw: galleryLines(IMG.retouch1, IMG.retouch2),
      trust_testimonials: [
        { quote: "마감이 빨라요.", person_name: "클라이언트", role: "후기" },
        { quote: "원하는 톤 그대로요.", person_name: "클라이언트", role: "후기" },
      ],
      services: [
        { title: "작업 예시", body: "인물 · 제품 · 보정." },
        { title: "상담", body: "레퍼런스 기준 견적." },
        { title: "의뢰", body: "작업 의뢰 후 일정." },
      ],
      brand_image_url: IMG.retouch1,
      imageUrl: IMG.retouch1,
    },
    "video-production": {
      slug: `video-production-${suf}`,
      brand_name: "OO 영상 스튜디오",
      job_title: "PD",
      tagline: "영상 제작 도와드립니다",
      intro: "포트폴리오 확인 후 제작 문의 버튼으로 연결.",
      trust_metric: "이번 달 제작 슬롯",
      gallery_urls_raw: galleryLines(IMG.videoProd1, IMG.videoProd2),
      trust_testimonials: [
        { quote: "촬영부터 편집까지 한 번에.", person_name: "클라이언트", role: "후기" },
        { quote: "유튜브 세팅 도와주셨어요.", person_name: "클라이언트", role: "후기" },
      ],
      services: [
        { title: "포트폴리오", body: "홍보 · 브이로그 · 숏폼." },
        { title: "상담", body: "기획 · 견적 · 일정." },
        { title: "제작 문의", body: "지금 문의 후 계약." },
      ],
      brand_image_url: IMG.videoProd1,
      imageUrl: IMG.videoProd1,
    },
    "blog-marketing": {
      slug: `blog-marketing-${suf}`,
      brand_name: "OO 마케팅",
      job_title: "마케터",
      tagline: "상위 노출 도와드립니다",
      intro: "진행 사례 확인 후 문의 버튼으로 상담 연결.",
      trust_metric: "오늘 상담 접수",
      gallery_urls_raw: galleryLines(IMG.blogMkt1, IMG.blogMkt2),
      trust_testimonials: [
        { quote: "키워드 반영이 빨랐어요.", person_name: "고객", role: "후기" },
        { quote: "상담 후 바로 플랜 나왔어요.", person_name: "고객", role: "후기" },
      ],
      services: [
        { title: "사례", body: "지역 · 업종별 노출." },
        { title: "상담", body: "블로그 전략 제안." },
        { title: "문의", body: "문의 후 계약." },
      ],
      brand_image_url: IMG.blogMkt1,
      imageUrl: IMG.blogMkt1,
    },
    "event-planning": {
      slug: `event-planning-${suf}`,
      brand_name: "OO 이벤트",
      job_title: "기획",
      tagline: "행사 진행 가능합니다",
      intro: "진행 사례 확인 후 행사 문의 버튼으로 연결.",
      trust_metric: "오늘 미팅 가능",
      gallery_urls_raw: galleryLines(IMG.eventPlan1, IMG.eventPlan2),
      trust_testimonials: [
        { quote: "행사 당일 진행이 매끄러웠어요.", person_name: "고객", role: "후기" },
        { quote: "견적이 명확했습니다.", person_name: "고객", role: "후기" },
      ],
      services: [
        { title: "진행 사례", body: "세미나 · 행사 · 런칭." },
        { title: "상담", body: "규모 · 예산 맞춤." },
        { title: "행사 문의", body: "문의 후 제안." },
      ],
      brand_image_url: IMG.eventPlan1,
      imageUrl: IMG.eventPlan1,
    },
    "music-lesson": {
      slug: `music-lesson-${suf}`,
      brand_name: "OO 음악 레슨",
      job_title: "강사",
      tagline: "지금 레슨 가능합니다",
      intro: "레슨 영상·레벨 확인 후 신청 버튼으로 연결.",
      trust_metric: "오늘 체험 가능",
      gallery_urls_raw: galleryLines(IMG.musicLesson1, IMG.musicLesson2),
      trust_testimonials: [
        { quote: "영상 보고 신청했어요.", person_name: "학생", role: "후기" },
        { quote: "오늘부터 레슨 시작!", person_name: "학생", role: "후기" },
      ],
      services: [
        { title: "레슨 영상", body: "피아노 · 기타 · 보컬." },
        { title: "상담", body: "레벨 · 목표 협의." },
        { title: "레슨 신청", body: "신청 후 일정." },
      ],
      brand_image_url: IMG.musicLesson1,
      imageUrl: IMG.musicLesson1,
    },
    wedding: {
      slug: `wedding-${suf}`,
      brand_name: "OO 웨딩",
      job_title: "플래너",
      tagline: "지금 상담 가능",
      intro: "진행 사례 확인 후 상담 예약 버튼으로 연결.",
      trust_metric: "오늘 예약 가능",
      gallery_urls_raw: galleryLines(IMG.wedding1, IMG.wedding2),
      trust_testimonials: [
        { quote: "당일 스케줄 조율 감사해요.", person_name: "예비부부", role: "후기" },
        { quote: "사례 보고 결정했어요.", person_name: "예비부부", role: "후기" },
      ],
      services: [
        { title: "사례", body: "스튜디오 · 본식 · 소품." },
        { title: "상담", body: "예산 · 일정 맞춤." },
        { title: "상담 예약", body: "예약 후 미팅." },
      ],
      brand_image_url: IMG.wedding1,
      imageUrl: IMG.wedding1,
    },
    "travel-tour": {
      slug: `travel-tour-${suf}`,
      brand_name: "OO 여행",
      job_title: "투어",
      tagline: "지금 예약 가능",
      intro: "여행 상품·가격 확인 후 예약 버튼으로 연결.",
      trust_metric: "이번 시즌 잔여 좌석",
      gallery_urls_raw: galleryLines(IMG.travel1, IMG.travel2),
      trust_testimonials: [
        { quote: "일정 안내가 명확했어요.", person_name: "여행객", role: "후기" },
        { quote: "가격 그대로 진행됐어요.", person_name: "여행객", role: "후기" },
      ],
      services: [
        { title: "여행 상품", body: "패키지 · 자유 · 당일." },
        { title: "가격", body: "일정·옵션별 안내." },
        { title: "예약", body: "예약 후 확정." },
      ],
      brand_image_url: IMG.travel1,
      imageUrl: IMG.travel1,
    },
    translation: {
      slug: `translation-${suf}`,
      brand_name: "OO 번역·통역",
      job_title: "통역사",
      tagline: "빠르게 번역해드립니다",
      intro: "언어·분야 확인 후 번역 문의 버튼으로 연결.",
      trust_metric: "당일 견적 가능",
      gallery_urls_raw: galleryLines(IMG.translation1, IMG.translation2),
      trust_testimonials: [
        { quote: "마감 전날 맡겼는데 맞춰 주셨어요.", person_name: "고객", role: "후기" },
        { quote: "통역 만족했습니다.", person_name: "고객", role: "후기" },
      ],
      services: [
        { title: "언어", body: "영 · 일 · 중 · 동시." },
        { title: "상담", body: "분량 · 용도 확인." },
        { title: "번역 문의", body: "문의 후 일정." },
      ],
      brand_image_url: IMG.translation1,
      imageUrl: IMG.translation1,
    },
    "legal-tax": {
      slug: `legal-tax-${suf}`,
      brand_name: "OO 법무·세무",
      job_title: "전문가",
      tagline: "전문 상담 가능합니다",
      intro: "분야 선택 후 상담 예약 버튼으로 바로 연결.",
      trust_metric: "오늘 초기 상담 가능",
      gallery_urls_raw: galleryLines(IMG.legalTax1, IMG.legalTax2),
      trust_testimonials: [
        { quote: "필요한 서류만 안내해 주세요.", person_name: "고객", role: "후기" },
        { quote: "일정 맞춰 진행됐어요.", person_name: "고객", role: "후기" },
      ],
      services: [
        { title: "분야", body: "민사 · 노무 · 세무 신고." },
        { title: "상담", body: "상황 요약 후 방향 제안." },
        { title: "상담 예약", body: "예약 후 연락." },
      ],
      brand_image_url: IMG.legalTax1,
      imageUrl: IMG.legalTax1,
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
