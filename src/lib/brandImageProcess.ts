/** 명함 히어로(16:9) 표시용 — 업로드 파일 용량·해상도 정리 */
const MAX_LONG_EDGE = 1920;
const JPEG_QUALITY = 0.88;

/**
 * 이미지를 캔버스에서 긴 변 기준 리사이즈 후 JPEG data URL로 반환합니다.
 * 표시 비율(16:9)은 UI에서 object-fit: cover로 맞춥니다.
 */
export async function optimizeImageFileToDataUrl(file: File): Promise<string> {
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
    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  } finally {
    bitmap.close();
  }
}

/** "50% 50%" → { x, y } 0~100 */
export function parseFocalPercent(pos: string): { x: number; y: number } {
  const parts = pos.trim().split(/\s+/).filter(Boolean);
  const x = clampPercent(parseFloat((parts[0] ?? "50").replace("%", "")) || 50);
  const y = clampPercent(parseFloat((parts[1] ?? parts[0] ?? "50").replace("%", "")) || 50);
  return { x, y };
}

/** 드래그 델타로 퍼센트 갱신 (cover 기준, 드래그 방향과 화면 이동이 자연스럽게 맞도록) */
export function focalAfterDrag(
  current: string,
  deltaX: number,
  deltaY: number,
  frameW: number,
  frameH: number,
  sensitivity = 1.15,
): string {
  const { x, y } = parseFocalPercent(current);
  const nx = clampPercent(x - (deltaX / Math.max(frameW, 1)) * 100 * sensitivity);
  const ny = clampPercent(y - (deltaY / Math.max(frameH, 1)) * 100 * sensitivity);
  return `${nx}% ${ny}%`;
}

function clampPercent(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n * 10) / 10));
}

export function formatFocalPercent(x: number, y: number): string {
  return `${clampPercent(x)}% ${clampPercent(y)}%`;
}
