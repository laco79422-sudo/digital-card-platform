/** 기본 OG 이미지 — 카카오 feed 썸네일용 */
export const KAKAO_FEED_DEFAULT_IMAGE = "https://mycardlab.netlify.app/og-image.png";

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
    /* 키·도메인 불일치 등 */
  }
}

/**
 * Kakao.Link.sendDefault — mobileWebUrl / webUrl 모두 shareUrl(개인 명함)로 고정.
 * SDK 미초기화 시 false.
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
 * 1) 카카오 feed(링크 = shareUrl)
 * 2) Web Share — `url`에 개인 명함 절대 URL만 넘김 (text는 짧은 안내, OG 홈 혼선 완화)
 * 3) 클립보드에 shareUrl만
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
    shortMessage = "아래 링크로 디지털 명함이 열려요.",
    kakaoDescription = "업무용 프로필을 간편하게 공유하세요.",
    kakaoImageUrl,
  } = opts;

  if (tryKakaoLinkFeedShare({ shareUrl, title, description: kakaoDescription, imageUrl: kakaoImageUrl })) {
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
    window.prompt("명함 링크를 복사해 주세요", shareUrl);
    return "clipboard";
  }
}
