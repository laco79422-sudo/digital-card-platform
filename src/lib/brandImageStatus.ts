/**
 * 대표 이미지 검수 상태 — 편집기·DB 공통
 * DB에는 checking / rejected_auto 를 저장하지 않습니다(클라이언트 전용).
 */

/** DB·원격에 저장되는 값 (rejected_auto·checking 은 저장하지 않음) */
export type BrandImagePersistedStatus = "pending_review" | "approved" | "rejected_manual" | null;

/** 편집기·응답 — rejected_auto / checking 은 브라우저에서만 사용 */
export type BrandImageStatus = BrandImagePersistedStatus | "checking" | "rejected_auto";

/** Supabase upsert 시 클라이언트 전용 값 제거 */
export function brandImageStatusForRemote(s: BrandImageStatus | null | undefined): BrandImagePersistedStatus {
  if (s == null || s === "checking" || s === "rejected_auto") return null;
  return s;
}

/** 행·쿼리 파라미터 → 앱 상태 (레거시 pending / rejected 호환) */
export function normalizeBrandImageStatus(raw: string | null | undefined): BrandImageStatus {
  if (raw == null) return null;
  const t = String(raw).trim();
  if (!t || t === "none") return null;
  if (t === "pending") return "pending_review";
  if (t === "rejected") return "rejected_manual";
  if (
    t === "checking" ||
    t === "pending_review" ||
    t === "approved" ||
    t === "rejected_manual" ||
    t === "rejected_auto"
  ) {
    return t;
  }
  return null;
}

/** 공개 명함·히어로 URL에서 사용자 업로드를 숨길 때 (레거시 DB 값 포함) */
export function isBrandImagePublicHeroBlocked(s: string | null | undefined): boolean {
  const n = normalizeBrandImageStatus(s);
  return n === "pending_review" || n === "rejected_manual" || n === "rejected_auto" || n === "checking";
}

/** 승인된 URL(approved_public_hero_url)만 노출해야 하는 저장 상태 */
export function shouldPersistApprovedHeroOnly(s: BrandImageStatus | string | null | undefined): boolean {
  return isBrandImagePublicHeroBlocked(s == null ? null : String(s));
}

export function brandImageStatusBadgeLabel(s: BrandImageStatus | null | undefined): string | null {
  const n = s === null || s === undefined ? null : normalizeBrandImageStatus(String(s));
  switch (n) {
    case "checking":
      return "이미지 검사 중입니다";
    case "pending_review":
      return "1차 검수 완료 · 관리자 확인 대기";
    case "approved":
      return "승인 완료 · 공개 중";
    case "rejected_auto":
      return "자동 검수 실패";
    case "rejected_manual":
      return "관리자 반려";
    default:
      return null;
  }
}

export function brandImageStatusBadgeTone(
  s: BrandImageStatus | null | undefined,
): "default" | "brand" | "success" | "warning" | "danger" {
  const n = s === null || s === undefined ? null : normalizeBrandImageStatus(String(s));
  switch (n) {
    case "checking":
      return "brand";
    case "pending_review":
      return "warning";
    case "approved":
      return "success";
    case "rejected_auto":
    case "rejected_manual":
      return "danger";
    default:
      return "default";
  }
}
