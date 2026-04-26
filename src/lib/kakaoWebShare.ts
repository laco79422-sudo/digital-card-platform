/** \uae30\ubcf8 OG \uc774\ubbf8\uc9c0 \u2014 \uce74\uce74\uc624 feed \uc378\ub124\uc77c\uc6a9 */
export const KAKAO_FEED_DEFAULT_IMAGE = "https://mycardlab.netlify.app/og-default.png";

declare global {
  interface Window {
    Kakao?: {
      isInitialized?: () => boolean;
      init?: (key: string) => void;
      Link?: { sendDefault: (opts: unknown) => void };
    };
  }
}

export function initKakaoJsSdkFromEnv(): void {
  const key = import.meta.env.VITE_KAKAO_JS_KEY;
  if (!key || typeof window === "undefined" || !window.Kakao?.init) return;
  try {
    if (!window.Kakao.isInitialized?.()) window.Kakao.init(key);
  } catch {
    /* \ud0a4\u00b7\ub3c4\uba54\uc778 \ubd88\uc77c\uce58 \ub4f1 */
  }
}

/**
 * Kakao.Link.sendDefault \u2014 mobileWebUrl / webUrl \ubaa8\ub450 shareUrl(\uac1c\uc778 \uba85\ud568)\ub85c \uace0\uc815.
 * SDK \ubbf8\ucd08\uae30\ud654 \uc2dc false.
 */
export function tryKakaoLinkFeedShare(params: {
  shareUrl: string;
  title: string;
  description: string;
  imageUrl?: string;
}): boolean {
  initKakaoJsSdkFromEnv();
  const K = typeof window !== "undefined" ? window.Kakao : undefined;
  if (!K?.Link?.sendDefault || !K.isInitialized?.()) return false;

  const { shareUrl, title, description, imageUrl = KAKAO_FEED_DEFAULT_IMAGE } = params;
  console.info("[Linko Kakao SDK payload]", {
    shareUrl,
    title,
    description,
    imageUrl,
  });
  try {
    K.Link.sendDefault({
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
    });
    return true;
  } catch {
    return false;
  }
}

export type ShareCardFallback = "shared" | "clipboard" | "cancelled";

/**
 * 1) \uce74\uce74\uc624 feed(\ub9c1\ud06c = shareUrl)
 * 2) Web Share \u2014 `url`\uc5d0 \uac1c\uc778 \uba85\ud568 \uc808\ub300 URL\ub9cc \ub118\uae40 (text\ub294 \uc9e7\uc740 \uc548\ub0b4, OG \ud648 \ud63c\uc120 \uc644\ud654)
 * 3) \ud074\ub9bd\ubcf4\ub4dc\uc5d0 shareUrl\ub9cc
 */
export async function shareCardLinkNativeOrder(opts: {
  shareUrl: string;
  title: string;
  shortMessage?: string;
  kakaoDescription?: string;
  kakaoImageUrl?: string;
}): Promise<ShareCardFallback> {
  const {
    shareUrl,
    title,
    shortMessage = "\uc544\ub798 \ub9c1\ud06c\ub85c \ub514\uc9c0\ud138 \uba85\ud568\uc774 \uc5f4\ub824\uc694.",
    kakaoDescription: kakaoDescriptionOpt,
    kakaoImageUrl,
  } = opts;

  const kakaoDescription = kakaoDescriptionOpt ?? shortMessage;
  const imageUrlResolved = kakaoImageUrl ?? KAKAO_FEED_DEFAULT_IMAGE;

  if (tryKakaoLinkFeedShare({ shareUrl, title, description: kakaoDescription, imageUrl: imageUrlResolved })) {
    return "shared";
  }

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title,
        text: shortMessage,
        url: shareUrl,
      });
      return "shared";
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return "cancelled";
    }
  }

  try {
    await navigator.clipboard.writeText(shareUrl);
    return "clipboard";
  } catch {
    window.prompt("\uba85\ud568 \ub9c1\ud06c\ub97c \ubcf5\uc0ac\ud574 \uc8fc\uc138\uc694", shareUrl);
    return "clipboard";
  }
}
