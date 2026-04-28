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
 */
import { getCardHeroImageUrl } from "@/lib/businessCardHeroImage";
import { resolveBusinessCardPublicUrl } from "@/lib/cardShareUrl";
import type { BusinessCard } from "@/types/domain";

/** 피드 썸네일 기본값 — Kakao는 HTTPS 이미지 URL 권장 */
export const KAKAO_FEED_DEFAULT_IMAGE = "https://linkoapp.kr/og/linko-main.png";

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

const FALLBACK_CARD_TITLE = "린코 디지털 명함";
const FALLBACK_CARD_DESCRIPTION = "링크 하나로 소개부터 상담까지 연결됩니다.";

function resolveShareUrl(card: BusinessCard): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const raw =
    (card as BusinessCard & { public_url?: string | null }).public_url?.trim() ||
    card.publicUrl?.trim() ||
    resolveBusinessCardPublicUrl(card, origin);
  if (raw) return raw;
  const slug = card.slug?.trim();
  if (slug && slug.length >= 2) return `${origin.replace(/\/$/, "")}/c/${encodeURIComponent(slug)}`;
  return `${origin}/`;
}

function resolveFeedTitle(card: BusinessCard): string {
  return card.person_name?.trim() || card.name?.trim() || card.brand_name?.trim() || FALLBACK_CARD_TITLE;
}

function resolveFeedDescription(card: BusinessCard): string {
  return card.intro?.trim() || card.tagline?.trim() || FALLBACK_CARD_DESCRIPTION;
}

function resolveFeedImageUrl(card: BusinessCard, origin: string): string {
  const hero = getCardHeroImageUrl(card).trim();
  if (hero.startsWith("https://")) return hero;
  if (hero.startsWith("http://")) return hero;
  if (hero.startsWith("/")) return `${origin.replace(/\/$/, "")}${hero}`;
  const fallbackPath = `${origin.replace(/\/$/, "")}/og-default.png`;
  return fallbackPath;
}

async function copyShareUrl(url: string, message: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(url);
    window.alert(message);
  } catch {
    window.prompt("링크를 복사해 주세요", url);
    window.alert(message);
  }
}

/**
 * 명함 카드 → 카카오톡 피드 공유 (Kakao.Share.sendDefault).
 * SDK·키 없음 또는 오류 시 링크 복사만 수행합니다.
 */
export async function shareCardToKakao(card: BusinessCard): Promise<void> {
  const url = resolveShareUrl(card);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const title = resolveFeedTitle(card);
  const description = resolveFeedDescription(card);
  const imageUrl = resolveFeedImageUrl(card, origin) || KAKAO_FEED_DEFAULT_IMAGE;

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

    await copyShareUrl(url, KAKAO_CLIPBOARD_FALLBACK_MSG);
  } catch (error) {
    console.error("[shareCardToKakao]", error);
    await copyShareUrl(url, KAKAO_CLIPBOARD_ERROR_MSG);
  }
}

/** 추천·홍보 링크 등 임의 URL 피드 공유 */
export async function shareUrlToKakaoFeed(opts: {
  shareUrl: string;
  title: string;
  description: string;
  imageUrl?: string;
  buttonTitle?: string;
}): Promise<void> {
  const { shareUrl, title, description, imageUrl = KAKAO_FEED_DEFAULT_IMAGE, buttonTitle = "명함 보기" } = opts;

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
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
        },
        buttons: [
          {
            title: buttonTitle,
            link: {
              mobileWebUrl: shareUrl,
              webUrl: shareUrl,
            },
          },
        ],
      });
      return;
    }

    await copyShareUrl(shareUrl, KAKAO_CLIPBOARD_FALLBACK_MSG);
  } catch (error) {
    console.error("[shareUrlToKakaoFeed]", error);
    await copyShareUrl(shareUrl, KAKAO_CLIPBOARD_ERROR_MSG);
  }
}
