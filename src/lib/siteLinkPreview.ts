/**
 * 카카오·당근·SNS 링크 미리보기용.
 * `index.html`의 OG 메타와 반드시 동일하게 유지하세요.
 */
export const SITE_CANONICAL_URL = "https://linkoapp.kr" as const;
/** 랜딩·서비스 소개 기본 OG (Edge `/` 주입과 동일 경로 권장) */
export const SITE_OG_DEFAULT_IMAGE_URL = "https://linkoapp.kr/og-default.png" as const;
export const SITE_OG_IMAGE_URL = SITE_OG_DEFAULT_IMAGE_URL;
/** 명함 카드에 이미지가 없을 때 Kakao 미리보기 폴백 */
export const SITE_OG_CARD_FALLBACK_URL = "https://linkoapp.kr/og-card-default.png" as const;
/** 회원가입·추천 링크 미리보기 */
export const SITE_OG_REFERRAL_IMAGE_URL = "https://linkoapp.kr/og-referral.png" as const;
export const SITE_OG_TITLE = "린코 디지털 명함" as const;
export const SITE_OG_DESCRIPTION = "명함 하나로 고객이 먼저 찾아옵니다" as const;
