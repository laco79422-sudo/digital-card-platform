/** Netlify에 배포 시 Functions 베이스(예: https://xxx.netlify.app) 미설정 시 상대 경로 사용 */
export function tossConfirmPaymentUrl(): string {
  const base = import.meta.env.VITE_NETLIFY_FUNCTIONS_BASE?.trim();
  if (base) return `${base.replace(/\/$/, "")}/.netlify/functions/toss-confirm-payment`;
  return "/.netlify/functions/toss-confirm-payment";
}
