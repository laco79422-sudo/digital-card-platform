/** 브랜드 대표 이미지 파일 검증 — 업로드 UI와 동일 규칙 */

export const BRAND_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

/** 짧은 변 기준 최소 픽셀 — 너무 작은 썸네일·아이콘 차단 */
export const BRAND_IMAGE_MIN_EDGE_PX = 200;

export const BRAND_IMAGE_ACCEPT =
  "image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

export const BRAND_IMAGE_FORMAT_ERROR = "이미지는 JPG, JPEG, PNG, WEBP 형식만 등록할 수 있습니다.";

export const BRAND_IMAGE_SIZE_ERROR = "이미지 용량은 5MB 이하로 등록해 주세요.";

export const BRAND_IMAGE_FILENAME_ERROR =
  "파일 이름이 올바르지 않습니다. 특수문자·경로 문자 없이 JPG/PNG/WEBP만 사용해 주세요.";

export const BRAND_IMAGE_TOO_SMALL_ERROR = `이미지가 너무 작습니다. 가로·세로 모두 ${BRAND_IMAGE_MIN_EDGE_PX}px 이상인 이미지를 올려 주세요.`;

export function validateBrandImageFilename(fileName: string): { ok: true } | { ok: false; message: string } {
  const name = fileName.trim();
  if (!name || name.length > 240) {
    return { ok: false, message: BRAND_IMAGE_FILENAME_ERROR };
  }
  if (/[\\/<>:"|?*\x00-\x1f]/.test(name)) {
    return { ok: false, message: BRAND_IMAGE_FILENAME_ERROR };
  }
  if (!/\.(jpe?g|png|webp)$/i.test(name)) {
    return { ok: false, message: BRAND_IMAGE_FORMAT_ERROR };
  }
  return { ok: true };
}

export function validateBrandImageFile(file: File): { ok: true } | { ok: false; message: string } {
  const nameCheck = validateBrandImageFilename(file.name);
  if (!nameCheck.ok) return nameCheck;
  if (file.size > BRAND_IMAGE_MAX_BYTES) {
    return { ok: false, message: BRAND_IMAGE_SIZE_ERROR };
  }
  const okType = /^image\/(jpeg|jpg|png|webp)$/i.test(file.type);
  const okName = /\.(jpe?g|png|webp)$/i.test(file.name);
  if (!okType || !okName) {
    return { ok: false, message: BRAND_IMAGE_FORMAT_ERROR };
  }
  return { ok: true };
}

/** object URL 또는 http(s) URL — 디코드 및 픽셀 크기 확인 */
export function measureImageDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("decode"));
    img.src = url;
  });
}
