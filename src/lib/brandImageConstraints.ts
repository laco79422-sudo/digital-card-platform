/** 브랜드 대표 이미지 파일 검증 — 업로드 UI와 동일 규칙 */

export const BRAND_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const BRAND_IMAGE_ACCEPT =
  "image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

export const BRAND_IMAGE_FORMAT_ERROR = "이미지는 JPG, PNG, WEBP 형식만 등록할 수 있습니다.";

export const BRAND_IMAGE_SIZE_ERROR = "이미지 용량은 5MB 이하로 등록해 주세요.";

export function validateBrandImageFile(file: File): { ok: true } | { ok: false; message: string } {
  if (file.size > BRAND_IMAGE_MAX_BYTES) {
    return { ok: false, message: BRAND_IMAGE_SIZE_ERROR };
  }
  const okType = /^image\/(jpeg|jpg|png|webp)$/i.test(file.type);
  const okName = /\.(jpe?g|png|webp)$/i.test(file.name);
  if (!okType && !okName) {
    return { ok: false, message: BRAND_IMAGE_FORMAT_ERROR };
  }
  return { ok: true };
}
