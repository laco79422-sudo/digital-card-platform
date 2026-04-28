import {
  initKakao,
  KAKAO_FEED_DEFAULT_IMAGE,
} from "@/lib/kakao";

/** @deprecated — {@link initKakao} 사용 */
export function initKakaoJsSdkFromEnv(): void {
  initKakao();
}

export { KAKAO_FEED_DEFAULT_IMAGE } from "@/lib/kakao";

/**
 * Kakao.Share.sendDefault(피드) — 카카오톡 공유의 기본 경로.
 * SDK·키 없음 또는 호출 실패 시 false.
 */
export function tryKakaoShareSendDefault(params: {
  shareUrl: string;
  title: string;
  description: string;
  imageUrl?: string;
  buttonTitle?: string;
}): boolean {
  if (!initKakao()) return false;
  const K = window.Kakao;
  if (!K?.Share?.sendDefault) return false;
  const imageUrl = params.imageUrl ?? KAKAO_FEED_DEFAULT_IMAGE;
  try {
    K.Share.sendDefault({
      objectType: "feed",
      content: {
        title: params.title,
        description: params.description,
        imageUrl,
        link: {
          mobileWebUrl: params.shareUrl,
          webUrl: params.shareUrl,
        },
      },
      buttons: [
        {
          title: params.buttonTitle ?? "명함 보기",
          link: {
            mobileWebUrl: params.shareUrl,
            webUrl: params.shareUrl,
          },
        },
      ],
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * 레거시 Kakao.Link.sendDefault — Share 미지원 환경 보조.
 */
export function tryKakaoLinkFeedShare(params: {
  shareUrl: string;
  title: string;
  description: string;
  imageUrl?: string;
}): boolean {
  initKakao();
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
 * 1) Kakao.Share.sendDefault (피드)
 * 2) Kakao.Link.sendDefault (보조)
 * 3) 클립보드 — navigator.share 는 사용하지 않음 (카카오 공유 우선 정책)
 */
export async function shareCardLinkNativeOrder(opts: {
  shareUrl: string;
  title: string;
  shortMessage?: string;
  kakaoDescription?: string;
  kakaoImageUrl?: string;
  buttonTitle?: string;
}): Promise<ShareCardFallback> {
  const {
    shareUrl,
    title,
    shortMessage = "아래 링크로 디지털 명함이 열려요.",
    kakaoDescription: kakaoDescriptionOpt,
    kakaoImageUrl,
    buttonTitle,
  } = opts;

  const kakaoDescription = kakaoDescriptionOpt ?? shortMessage;
  const imageUrlResolved = kakaoImageUrl ?? KAKAO_FEED_DEFAULT_IMAGE;

  if (
    tryKakaoShareSendDefault({
      shareUrl,
      title,
      description: kakaoDescription,
      imageUrl: imageUrlResolved,
      buttonTitle,
    })
  ) {
    return "shared";
  }

  if (
    tryKakaoLinkFeedShare({
      shareUrl,
      title,
      description: kakaoDescription,
      imageUrl: imageUrlResolved,
    })
  ) {
    return "shared";
  }

  try {
    await navigator.clipboard.writeText(shareUrl);
    return "clipboard";
  } catch {
    window.prompt("명함 링크를 복사해 주세요", shareUrl);
    return "clipboard";
  }
}
