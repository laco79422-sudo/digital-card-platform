/** 원 단위 — 명함 추가 등 상품 가격 */
export const PAYMENT_AMOUNTS_KRW = {
  extraCard: 10_900,
  shareStarter: 10_900,
  sharePro: 9_900,
} as const;

/** DB plan_type / payment 설명용 문자열 */
export const PAYMENT_PLAN_TYPES = {
  extra_card: "extra_card",
  share_link_starter: "share_link_starter",
  share_link_pro: "share_link_pro",
  design_request: "design_request",
  reservation_booking: "reservation_booking",
} as const;
