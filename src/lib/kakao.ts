/**
 * Kakao JavaScript SDK 연동 (카카오톡 공유).
 *
 * 카카오 Developers에서 아래 설정이 필요합니다.
 * - 플랫폼 > Web 플랫폼 등록
 * - 사이트 도메인:
 *   https://linkoapp.kr
 *   https://www.linkoapp.kr
 *   http://localhost:5173
 * - JavaScript 키를 환경변수 VITE_KAKAO_JAVASCRIPT_KEY 에 등록 (Netlify 등 배포 환경변수 포함)
 *
 * 카카오톡은 같은 URL의 미리보기 이미지를 캐시합니다.
 * 테스트 후 썸네일이 바로 안 바뀌면 카카오 디버거에서 URL별 캐시 초기화가 필요합니다.
 * - 내 명함: https://linkoapp.kr/c/{slug}
 * - 추천: https://linkoapp.kr/?ref={referralCode}
 */
import { canonicalSiteOrigin } from "@/lib/siteOrigin";
import type { BusinessCard } from "@/types/domain";

/** 공유 플로 구분 (문서·디버깅용) */
export type KakaoShareType = "cardShare" | "referralShare";

/** public 폴더 OG 에셋 (내 명함 기본 / 추천 / 서비스 기본) */
export const OG_CARD_DEFAULT_PATH = "/og-card-default.png";
export const OG_REFERRAL_PATH = "/og-referral.png";
export const OG_SERVICE_DEFAULT_PATH = "/og-default.png";

/** 카카오 디버거·레거시 폴백용 프로덕션 절대 URL */
export const KAKAO_FEED_DEFAULT_IMAGE = `https://linkoapp.kr${OG_SERVICE_DEFAULT_PATH}`;

export const KAKAO_CLIPBOARD_FALLBACK_MSG =
  "카카오톡 자동 공유 설정이 아직 연결되지 않아 링크를 복사했습니다.\n카카오톡 대화창에 붙여넣어 공유해 주세요.";

export const KAKAO_CLIPBOARD_ERROR_MSG =
  "카카오톡 공유에 실패해 링크를 복사했습니다.\n카카오톡 대화창에 붙여넣어 공유해 주세요.";

declare global {
  interface Window {
    Kakao?: {
      init?: (key: string) => void;
      isInitialized?: () => boolean;
      Share?: { sendDefault: (opts: unknown) => void };
      Link?: { sendDefault: (opts: unknown) => void };
    };
  }
}

export function initKakao(): boolean {
  const kakaoKey =
    import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY?.trim() || import.meta.env.VITE_KAKAO_JS_KEY?.trim() || "";

  if (!kakaoKey) {
    console.warn("[Kakao] JavaScript Key가 없습니다. VITE_KAKAO_JAVASCRIPT_KEY를 설정해 주세요.");
    return false;
  }

  if (!window.Kakao) {
    console.warn("[Kakao] SDK가 로드되지 않았습니다. index.html의 kakao.min.js 스크립트를 확인해 주세요.");
    return false;
  }

  try {
    if (!window.Kakao.isInitialized?.()) {
      window.Kakao.init?.(kakaoKey);
    }
  } catch (e) {
    console.warn("[Kakao] init 실패", e);
    return false;
  }

  return Boolean(window.Kakao.isInitialized?.());
}

function absoluteSiteUrl(path: string): string {
  const origin = canonicalSiteOrigin();
  return `${origin.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

function resolveHttpsImageUrl(raw: string | null | undefined, origin: string): string | null {
  const u = raw?.trim();
  if (!u) return null;
  if (u.startsWith("https://")) return u;
  if (u.startsWith("http://")) return u;
  if (u.startsWith("/")) return `${origin.replace(/\/$/, "")}${u}`;
  return `${origin.replace(/\/$/, "")}/${u}`;
}

/** 내 명함 공유 전용 — 추천용 OG 이미지 사용 안 함 */
function resolveMyCardShareImageUrl(card: BusinessCard): string {
  const origin = canonicalSiteOrigin();
  const fallbackCard = absoluteSiteUrl(OG_CARD_DEFAULT_PATH);
  const picked =
    resolveHttpsImageUrl(card.og_image_url ?? null, origin) ??
    resolveHttpsImageUrl(card.image_url ?? null, origin) ??
    resolveHttpsImageUrl(card.profile_image_url ?? null, origin);
  return picked ?? fallbackCard;
}

async function copyShareUrlWithAlert(url: string, message: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(url);
    window.alert(message);
  } catch {
    window.prompt("링크를 복사해 주세요", url);
    window.alert(message);
  }
}

async function copyReferralLinkQuiet(url: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    window.prompt("링크를 복사해 주세요", url);
  }
}

/**
 * 내 명함 공유 (cardShare)
 * 공개 URL: {canonicalOrigin}/c/{slug}
 */
export async function shareMyCardToKakao(card: BusinessCard): Promise<void> {
  const origin = canonicalSiteOrigin();
  const slug = card.slug?.trim();
  const url =
    slug && slug.length >= 2 ? `${origin}/c/${encodeURIComponent(slug)}` : `${origin}/`;

  const displayName = card.name?.trim() || card.person_name?.trim() || "내";
  const title = `${displayName}님의 디지털 명함`;
  const description =
    card.job_title?.trim() ||
    card.intro?.trim() ||
    "링크 하나로 소개부터 상담까지 연결됩니다.";

  const imageUrl = resolveMyCardShareImageUrl(card);

  try {
    const ready = initKakao();

    if (ready && window.Kakao?.Share?.sendDefault) {
      window.Kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title,
          description,
          imageUrl,
          link: {
            mobileWebUrl: url,
            webUrl: url,
          },
        },
        buttons: [
          {
            title: "명함 보기",
            link: {
              mobileWebUrl: url,
              webUrl: url,
            },
          },
        ],
      });
      return;
    }

    await copyShareUrlWithAlert(url, KAKAO_CLIPBOARD_FALLBACK_MSG);
  } catch (error) {
    console.error("[shareMyCardToKakao]", error);
    await copyShareUrlWithAlert(url, KAKAO_CLIPBOARD_ERROR_MSG);
  }
}

/**
 * 추천 링크 공유 (referralShare)
 * 서비스 홍보 OG 이미지·문구만 사용 (개인 명함 이미지·이름 없음)
 * @returns true 이면 Kakao 공유창 호출 성공, false 이면 클립보드 폴백
 */
export async function shareReferralToKakao(referralUrl: string): Promise<boolean> {
  const origin = canonicalSiteOrigin();
  const imageUrl = `${origin.replace(/\/$/, "")}${OG_REFERRAL_PATH}`;
  const title = "린코 디지털 명함";
  const description =
    "명함 하나로 고객이 먼저 찾아옵니다. 내 추천 링크로 가입하면 이용권 혜택을 받을 수 있어요.";

  try {
    const ready = initKakao();

    if (ready && window.Kakao?.Share?.sendDefault) {
      window.Kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title,
          description,
          imageUrl,
          link: {
            mobileWebUrl: referralUrl,
            webUrl: referralUrl,
          },
        },
        buttons: [
          {
            title: "린코 시작하기",
            link: {
              mobileWebUrl: referralUrl,
              webUrl: referralUrl,
            },
          },
        ],
      });
      return true;
    }

    await copyReferralLinkQuiet(referralUrl);
    return false;
  } catch (error) {
    console.error("[shareReferralToKakao]", error);
    await copyReferralLinkQuiet(referralUrl);
    return false;
  }
}

/** @deprecated — {@link shareMyCardToKakao} 사용 */
export async function shareCardToKakao(card: BusinessCard): Promise<void> {
  await shareMyCardToKakao(card);
}
