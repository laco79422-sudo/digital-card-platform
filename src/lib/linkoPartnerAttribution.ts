/** 공개 명함 URL ?partner={uuid} — 카드별로 저장 후 예약·클릭 시 attribution에 사용 */

const SESSION_KEY = "linko_partner_by_card_v1";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isLikelyPartnerUserId(value: string | null | undefined): boolean {
  const v = value?.trim() ?? "";
  return UUID_RE.test(v);
}

/** 현재 주소의 `partner` 쿼리 — 공식 형식: /c/{slug}?partner={파트너 auth.uid} */
export function parsePartnerIdFromSearch(search: string): string | null {
  const raw = new URLSearchParams(search.startsWith("?") ? search : `?${search}`).get("partner")?.trim();
  if (!raw || !UUID_RE.test(raw)) return null;
  return raw.toLowerCase();
}

export function rememberPartnerForCard(cardId: string, partnerUserId: string): void {
  if (!cardId.trim() || !isLikelyPartnerUserId(partnerUserId)) return;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    map[cardId] = partnerUserId.toLowerCase();
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function getStoredPartnerForCard(cardId: string): string | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, string>;
    const p = map[cardId]?.trim();
    return isLikelyPartnerUserId(p) ? p!.toLowerCase() : null;
  } catch {
    return null;
  }
}

/** 절대 명함 URL에 `partner=` 파라미터를 붙입니다 (파트너 전용 공유 링크). */
export function appendPartnerQueryToUrl(fullUrl: string, partnerUserId: string): string {
  if (!fullUrl.trim() || !isLikelyPartnerUserId(partnerUserId)) return fullUrl;
  try {
    const u = new URL(fullUrl);
    u.searchParams.set("partner", partnerUserId.toLowerCase());
    return u.toString();
  } catch {
    const sep = fullUrl.includes("?") ? "&" : "?";
    return `${fullUrl}${sep}partner=${encodeURIComponent(partnerUserId.toLowerCase())}`;
  }
}
