/** Stripe 연동 예약용 플레이스홀더 — 행후 확장 */
export type StripePlaceholderConfig = {
  publishableKey: string | null;
};

export function readStripePlaceholder(): StripePlaceholderConfig {
  return {
    publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim() || null,
  };
}
