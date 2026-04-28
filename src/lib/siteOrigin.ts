/**
 * 프로덕션 도메인 등 고정 공유/NFC 주소가 필요할 때 사용합니다.
 * 로컬에서는 기본적으로 현재 origin을 씁니다.
 */
export function canonicalSiteOrigin(): string {
  const env = import.meta.env.VITE_PUBLIC_SITE_ORIGIN as string | undefined;
  if (typeof env === "string" && env.trim()) return env.trim().replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin.replace(/\/$/, "");
  return "https://linkoapp.kr";
}

/** NFC 태그에 넣을 수락 페이지 URL */
export function buildNfcAcceptUrl(cardId: string): string {
  return `${canonicalSiteOrigin()}/nfc/${encodeURIComponent(cardId)}`;
}
