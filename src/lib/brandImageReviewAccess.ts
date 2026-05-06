import type { UserRole } from "@/types/domain";

/** 이미지 2차 검증(직접 승인 제출) UI — 관리자·명함 디자이너만 */
export function canReviewBrandImageSecondStep(role: UserRole | null | undefined): boolean {
  return role === "admin" || role === "designer";
}
