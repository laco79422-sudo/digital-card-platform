/** 모든 사용자 공통 — 회사 고정 홍보 이미지 (추천 링크와 별개) */
export const REFERRAL_PROMO_IMAGE_URL = "/images/linko-referral-main.png";

const REFERRAL_PROMO_DOWNLOAD_FILENAME = "linko-referral-image.png";

export function buildReferralShareMessageText(referralUrl: string): string {
  return `나를 소개하는 가장 쉬운 방법, Linko 디지털 명함입니다.

정보를 입력하면 이미지형 명함과 상세 링크가 함께 만들어지고,
카카오톡, 당근, 블로그, 유튜브에 바로 공유할 수 있습니다.

아래 링크에서 무료로 시작해보세요.
${referralUrl}`;
}

export async function downloadReferralPromoImage(): Promise<void> {
  const imageUrl = REFERRAL_PROMO_IMAGE_URL;
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error("이미지를 불러오지 못했습니다.");
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = REFERRAL_PROMO_DOWNLOAD_FILENAME;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function copyReferralPromoImage(): Promise<"ok" | "unsupported"> {
  try {
    const response = await fetch(REFERRAL_PROMO_IMAGE_URL);
    if (!response.ok) throw new Error("fetch failed");
    const blob = await response.blob();

    if (
      typeof ClipboardItem === "undefined" ||
      !navigator.clipboard?.write ||
      !window.isSecureContext
    ) {
      return "unsupported";
    }

    await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    return "ok";
  } catch {
    return "unsupported";
  }
}
