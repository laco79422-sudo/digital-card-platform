/** 메인 랜딩 `#pricing` — 명함 구독형 단계 (UI 안내용) */

export const FREE_CARD_PLAN = {
  name: "무료",
  priceLabel: "₩0",
  priceSuffix: "체험",
  tagline: "먼저 써 보기",
  features: ["명함 1개 만들기", "공유 링크·카톡 보내기", "기본 조회 기록"],
  recommendFor: "흐름을 처음 테스트해 보고 싶은 분",
  cta: "무료로 시작하기",
  href: "/signup",
} as const;

export const BASIC_CARD_PLAN = {
  name: "기본",
  priceLabel: "₩49,000",
  priceSuffix: "/ 월",
  tagline: "유입부터 정리",
  features: [
    "명함 2개",
    "클릭·유입 경로 요약",
    "문의 알림 우선 받기",
    "고객 유입 링크 1개 포함",
  ],
  recommendFor: "혼자라도 규칙적인 문의 관리가 필요한 분",
  cta: "기본 시작하기",
  href: "/signup",
} as const;

export const GROWTH_CARD_PLAN = {
  name: "성장",
  priceLabel: "₩89,000",
  priceSuffix: "/ 월",
  tagline: "상담까지 이어 붙이기",
  features: [
    "명함 4개",
    "채널별 유입 라벨",
    "문의·상담 연결 카운트",
    "고객 유입 링크 3개 포함",
    "우선 순위 지원",
  ],
  recommendFor: "문의량이 늘고 매출까지 잡아야 하는 분",
  cta: "성장 플랜 선택",
  href: "/signup",
} as const;

export const SCALE_CARD_PLAN = {
  name: "확장",
  priceLabel: "₩299,000",
  priceSuffix: "/ 월",
  tagline: "팀 단위까지",
  features: ["명함 10개·역할별 구조", "심층 유입 분석 리포트", "고객 유입 링크 10개 포함", "다수 상담 대기열 관리"],
  recommendFor: "매장·팀 계정으로 채널을 나누고 싶은 분",
  cta: "확장 상담받기",
  href: "/signup?intent=business",
} as const;

export const ENTERPRISE_FULL_PACKAGE_PLAN = {
  name: "풀패키지",
  priceLabel: "₩1,490,000",
  priceSuffix: "부터",
  tagline: "도입부터 운영 코칭까지",
  features: ["온보딩 컨설팅", "채널 전략·카피 가이드", "홍보 파트너 연계 옵션", "전용 담당자 배치(협의)"],
  recommendFor: "사업 규모에 맞춘 풀 설계가 필요한 분",
  cta: "풀패키지 문의",
  href: "/signup?intent=business",
} as const;

/** 랜딩 그리드 순서 */
export const LANDING_PRICING_PLANS = [
  FREE_CARD_PLAN,
  BASIC_CARD_PLAN,
  GROWTH_CARD_PLAN,
  SCALE_CARD_PLAN,
  ENTERPRISE_FULL_PACKAGE_PLAN,
] as const;

/** @deprecated 랜딩은 LANDING_PRICING_PLANS 사용 */
export const STARTER_PLAN = BASIC_CARD_PLAN;
/** @deprecated 랜딩은 LANDING_PRICING_PLANS 사용 */
export const PRO_PLAN = GROWTH_CARD_PLAN;
