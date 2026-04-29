/** 업종별 기본 예약 결제 금액(원) — 명함 industry 문자열 기준 */
const FALLBACK = 10000;

const AMOUNT_BY_INDUSTRY_KEYWORD: [RegExp, number][] = [
  [/세차|wash/i, 35000],
  [/음식|식당|카페|맛집|레스토랑/i, 15000],
  [/미용|헤어|네일|살롱/i, 60000],
  [/인테리어|시공/i, 0],
  [/부동산|중개/i, 0],
  [/헬스|pt|필라테스|요가/i, 30000],
  [/학원|과외|레슨/i, 50000],
  [/정비|수리|출장/i, 45000],
  [/청소/i, 80000],
  [/촬영|스튜디오|영상/i, 120000],
];

export function defaultReservationAmountKrw(industry: string | null | undefined): number {
  const s = industry?.trim() ?? "";
  if (!s) return FALLBACK;
  for (const [re, amt] of AMOUNT_BY_INDUSTRY_KEYWORD) {
    if (re.test(s)) return amt > 0 ? amt : FALLBACK;
  }
  return FALLBACK;
}
