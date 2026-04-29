/**
 * 결제 제공자 추상화 — Toss 우선, Stripe 등 추가 시 확장
 */
export type PaymentProviderId = "toss" | "stripe";

export function readConfiguredPaymentProvider(): PaymentProviderId {
  const p = import.meta.env.VITE_PAYMENT_PROVIDER?.trim().toLowerCase();
  if (p === "stripe") return "stripe";
  return "toss";
}
