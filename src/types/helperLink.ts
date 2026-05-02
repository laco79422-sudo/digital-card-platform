/**
 * 헬퍼링크 시스템 — 도메인 타입 초안.
 * 자세한 흐름·DB 초안은 docs/helper-link-system-design.md 참고.
 */

/** 캠페인(헬퍼링크 신청 단위) 생명주기 */
export type HelperLinkStatus =
  | "pending" // 신청 대기 · 매칭 전
  | "approved" // 헬퍼 매칭 완료
  | "active" // 홍보 진행 중
  | "completed" // 종료
  | "settled"; // 정산 완료

/** 유료 헬퍼링크 기능이 켜진 사용자 (스펙: user.plan) */
export type UserHelperPlan = "standard" | "helper_active";

export type HelperPromoChannel = "kakaotalk" | "daangn" | "blog" | "youtube";

/** 내 공간 — 헬퍼링크 신청 폼 */
export interface HelperLinkApplicationInput {
  cardId: string;
  channels: HelperPromoChannel[];
  targetAudience: string;
  promoRegion: string;
  budgetNote: string;
  periodNote: string;
}

/** 캠페인 + 배정 헬퍼 (UI·API 공통) */
export interface HelperLinkCampaign {
  id: string;
  ownerUserId: string;
  cardId: string;
  status: HelperLinkStatus;
  channels: HelperPromoChannel[];
  targetAudience: string;
  promoRegion: string;
  budgetNote: string;
  periodNote: string;
  assignedHelperUserIds: string[];
  createdAt: string;
  activatedAt: string | null;
  completedAt: string | null;
}

/** 대시보드 집계 (스펙 §7) */
export interface HelperLinkStats {
  views: number;
  clicks: number;
  inquiries: number;
  directInquiries: number;
  helperInquiries: number;
  conversions: number;
  revenueKrw: number;
}

/** 문의 라우팅 (스펙 §6) */
export type InquiryRoute = "direct" | "helper";

export interface InquiryWithRouting {
  id: string;
  cardId: string;
  ownerUserId: string;
  inquiryType: string;
  route: InquiryRoute;
  /** 헬퍼 상담으로 배정된 경우 */
  assignedHelperUserId: string | null;
  /** 어떤 캠페인 유입인지 역추적 */
  helperLinkCampaignId: string | null;
  createdAt: string;
}

/** 정산 분배 (스펙 §10 — 비율은 캠페인·플랜별 설정으로 일반화) */
export interface RevenueSplitSnapshot {
  totalRevenueKrw: number;
  ownerShareKrw: number;
  helperShareKrw: number;
  platformFeeKrw: number;
}

/** 헬퍼별 성과 한 줄 (스펙 §9) */
export interface HelperPerformanceRow {
  helperUserId: string;
  displayName: string;
  influxCount: number;
  inquiryCount: number;
  contractCount: number;
  attributedRevenueKrw: number;
}
