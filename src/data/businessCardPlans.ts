/** 메인 가격 카드와 공유하는 스타터·프로 플랜 표시용 데이터 */

export const STARTER_PLAN = {
  name: "스타터",
  priceLabel: "₩14,900",
  /** 가격 옆 작은 글씨 */
  priceSuffix: "/ 월",
  tagline: "링크로 바로 시작",
  features: [
    "명함 1개 생성 가능",
    "공유 링크 1개 포함",
    "공유 링크 추가 시 1개당 10,900원",
    "클릭 기록 확인",
    "의뢰·상담을 한곳에서 관리",
  ],
  recommendFor: "프리랜서·1인 사업으로 바로 시작하는 분",
  cta: "스타터 선택",
  href: "/signup",
} as const;

export const PRO_PLAN = {
  name: "프로",
  priceLabel: "₩59,000",
  priceSuffix: "/ 월",
  tagline: "방문부터 결제 흐름까지",
  features: [
    "명함 3개 생성 가능",
    "공유 링크 3개 포함",
    "공유 링크 추가 시 1개당 9,900원",
    "방문부터 클릭까지 흐름 분석",
    "의뢰 동시 관리",
    "고객 흐름 확인",
  ],
  recommendFor: "문의가 늘고 고객 동선을 체계적으로 잡고 싶은 분",
  cta: "프로 시작하기",
  href: "/signup",
} as const;
