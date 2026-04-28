import { getCardHeroImageUrl } from "@/lib/businessCardHeroImage";
import { resolveBusinessCardPublicUrl } from "@/lib/cardShareUrl";
import { initKakaoJsSdkFromEnv, KAKAO_FEED_DEFAULT_IMAGE, tryKakaoLinkFeedShare } from "@/lib/kakaoWebShare";
import type { BusinessCard } from "@/types/domain";

const FALLBACK_TITLE = "린코 디지털 명함";
const FALLBACK_DESCRIPTION = "링크 하나로 소개부터 상담까지 연결됩니다.";

const MSG_CLIPBOARD_NO_SDK =
  "카카오톡 공유 설정이 아직 연결되지 않아 링크를 복사했습니다.\n카카오톡 대화창에 붙여넣어 공유해 주세요.";
const MSG_CLIPBOARD_FAILED =
  "카카오톡 공유에 실패해 링크를 복사했습니다.\n카카오톡 대화창에 붙여넣어 공유해 주세요.";

function kakaoJsKey(): string {
  return (
    import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY?.trim() ||
    import.meta.env.VITE_KAKAO_JS_KEY?.trim() ||
    ""
  );
}

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
  return (
    card.person_name?.trim() ||
    card.name?.trim() ||
    card.brand_name?.trim() ||
    FALLBACK_TITLE
  );
}

function resolveFeedDescription(card: BusinessCard): string {
  return card.intro?.trim() || card.tagline?.trim() || FALLBACK_DESCRIPTION;
}

/** Kakao 피드용 이미지 URL — 반드시 https 권장 */
function resolveFeedImageUrl(card: BusinessCard, origin: string): string {
  const hero = getCardHeroImageUrl(card).trim();
  if (hero.startsWith("https://")) return hero;
  if (hero.startsWith("http://")) return hero;
  if (hero.startsWith("/")) return `${origin.replace(/\/$/, "")}${hero}`;
  const fallbackPath = `${origin.replace(/\/$/, "")}/og-default.png`;
  return fallbackPath;
}

/**
 * 내 공간 명함 카드 → 카카오톡 피드 공유.
 * SDK 미설정·미초기화·오류 시 공개 링크만 클립보드 + 안내.
 */
export async function shareToKakao(card: BusinessCard): Promise<void> {
  const url = resolveShareUrl(card);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const title = resolveFeedTitle(card);
  const description = resolveFeedDescription(card);
  const imageUrl = resolveFeedImageUrl(card, origin) || KAKAO_FEED_DEFAULT_IMAGE;

  async function copyLink(message: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(url);
      window.alert(message);
    } catch {
      window.prompt("링크를 복사해 주세요", url);
      window.alert(message);
    }
  }

  if (!kakaoJsKey() || typeof window === "undefined") {
    await copyLink(MSG_CLIPBOARD_NO_SDK);
    return;
  }

  initKakaoJsSdkFromEnv();
  const K = window.Kakao;
  if (!K?.isInitialized?.()) {
    await copyLink(MSG_CLIPBOARD_NO_SDK);
    return;
  }

  try {
    if (K.Share?.sendDefault) {
      K.Share.sendDefault({
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

    if (tryKakaoLinkFeedShare({ shareUrl: url, title, description, imageUrl })) {
      return;
    }

    await copyLink(MSG_CLIPBOARD_NO_SDK);
  } catch (error) {
    console.error("[shareToKakao]", error);
    await copyLink(MSG_CLIPBOARD_FAILED);
  }
}
