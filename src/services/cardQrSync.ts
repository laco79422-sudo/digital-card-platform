import { buildQrDestinationUrl } from "@/lib/cardQrDestination";
import { generateQrPngDataUrl } from "@/lib/cardQrGenerate";
import { uploadQrImageDataUrl } from "@/lib/qrImageUpload";
import type { BusinessCard } from "@/types/domain";

/** 저장 후 호출: QR 생성 → 스토리지 업로드 → `qr_image_url` 채움 */
export async function syncQrImageAfterSave(card: BusinessCard): Promise<BusinessCard> {
  const slug = card.slug?.trim();
  if (!slug) return card;

  const destination = buildQrDestinationUrl(slug);
  let qr_image_url = card.qr_image_url ?? null;
  try {
    const dataUrl = await generateQrPngDataUrl(destination);
    qr_image_url = await uploadQrImageDataUrl(card.id, dataUrl);
  } catch (e) {
    console.warn("[cardQrSync] syncQrImageAfterSave upload skipped", e);
  }

  return { ...card, qr_image_url };
}
