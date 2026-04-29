/**
 * `/c/:slug` 공개 명함 — 라우트 파라미터와 DB `business_cards.slug` 매칭용.
 * React Router가 이미 디코드한 값이어도 안전하게 처리합니다.
 */
export function decodeRouteSlugParam(param: string | undefined): string {
  if (param == null || param === "") return "";
  try {
    return decodeURIComponent(param.replace(/\+/g, " "));
  } catch {
    return param;
  }
}

/** 한글 등 유니코드 정규형 통일 (입력·URL·DB 저장값 차이 완화) */
export function normalizeSlugLookup(s: string): string {
  return s.trim().normalize("NFC");
}

/** 두 슬러그가 같은 명함을 가리키는지 비교 */
export function slugEqualsStored(a: string | undefined | null, b: string): boolean {
  if (a == null || !b.trim()) return false;
  return normalizeSlugLookup(a) === normalizeSlugLookup(b);
}
