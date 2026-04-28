/** 메인·이용 안내 페이지에서 공통으로 쓰는 사업자 명함 플랜(스타터·프로) 표시용 데이터 */

export const STARTER_PLAN = {
  name: "스타터",
  priceLabel: "₩14,900",
  /** 가격 옆 작은 글씨 */
  priceSuffix: "/ 월",
  tagline: "혼자 시작하기",
  features: [
    "명함·링크 공유에 맞는 구성",
    "의뢰·상담을 한곳에서 관리",
    "클릭 기록으로 반응 확인",
    "공유 링크 1개 포함",
    "공유 링크 추가 시 1개당 10,900원",
  ],
  recommendFor: "프리랜서·1인 사업으로 바로 시작하는 분",
  cta: "스타터 선택",
  href: "/signup",
} as const;

export const PRO_PLAN = {
  name: "프로",
  priceLabel: "₩59,000",
  priceSuffix: "/ 월",
  tagline: "고객을 만드는 구조",
  features: [
    "명함 여러 개 운영",
    "방문부터 클릭까지 흐름 분석",
    "의뢰 동시 관리",
    "공유 링크 3개 포함",
    "공유 링크 추가 시 1개당 9,900원",
  ],
  recommendFor: "문의가 늘고 고객 동선을 체계적으로 잡고 싶은 분",
  cta: "프로 시작하기",
  href: "/signup",
} as const;
