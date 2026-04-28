/** QR·인쇄용 고정 공개 주소 (프로덕션 도메인 기준) */
export function buildQrDestinationUrl(slug: string): string {
  const s = slug.trim();
  return `https://linkoapp.kr/c/${encodeURIComponent(s)}`;
}
