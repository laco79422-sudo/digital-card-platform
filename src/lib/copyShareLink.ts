import { canonicalSiteOrigin } from "@/lib/siteOrigin";

/**
 * 명함 공개 페이지 절대 URL (`/c/{slug}`).
 * 프로덕션에서는 `VITE_PUBLIC_SITE_ORIGIN` 또는 https://linkoapp.kr 기준.
 */
export function buildCardPublicShareUrl(slug: string | undefined | null): string | null {
  const s = slug?.trim();
  if (!s || s.length < 2) return null;
  return `${canonicalSiteOrigin()}/c/${encodeURIComponent(s)}`;
}

export async function copyLinkToClipboard(url: string, type: "card" | "referral" = "card"): Promise<void> {
  try {
    await navigator.clipboard.writeText(url);
    if (type === "referral") {
      alert("추천 링크가 복사되었습니다.\n카카오톡 대화방이나 SNS에 붙여넣어 공유해 주세요.");
    } else {
      alert("명함 링크가 복사되었습니다.\n카카오톡 대화방을 열고 메시지 입력창에 붙여넣어 공유해 주세요.");
    }
  } catch (error) {
    console.error("링크 복사 실패:", error);
    alert("링크 복사에 실패했습니다. 링크를 직접 선택해 복사해 주세요.");
  }
}
