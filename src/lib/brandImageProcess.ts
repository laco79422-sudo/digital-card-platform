/** 명함 히어로(16:9) 표시용 — 업로드 파일 용량·해상도 정리 */
const MAX_LONG_EDGE = 1920;
const JPEG_QUALITY = 0.88;

export type OptimizedImageResult = { dataUrl: string; width: number; height: number };

/**
 * 이미지를 캔버스에서 긴 변 기준 리사이즈 후 JPEG data URL과 픽셀 크기를 반환합니다.
 * 편집기에서는 이 크기를 기준으로 16:9 프레임 안 배치를 재현합니다.
 */
export async function optimizeImageFileToDataUrl(file: File): Promise<OptimizedImageResult> {
  const bitmap = await createImageBitmap(file);
  try {
    let { width, height } = bitmap;
    const long = Math.max(width, height);
    if (long > MAX_LONG_EDGE) {
      const scale = MAX_LONG_EDGE / long;
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D를 사용할 수 없습니다.");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, width, height);
    return { dataUrl: canvas.toDataURL("image/jpeg", JPEG_QUALITY), width, height };
  } finally {
    bitmap.close();
  }
}
