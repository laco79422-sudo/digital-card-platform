import type { DesignRequestPaymentStatus, DesignRequestStatus, DesignRequestStyle } from "@/types/domain";

export const DESIGN_REQUEST_STYLE_LABEL: Record<DesignRequestStyle, string> = {
  simple: "심플",
  premium: "고급",
  emotional: "감성",
  business: "비즈니스",
  free: "자유형",
};

export const DESIGN_REQUEST_STATUS_LABEL: Record<DesignRequestStatus, string> = {
  pending_payment: "결제 대기",
  paid: "결제 완료",
  assigned: "제작 전문가 배정",
  draft_submitted: "시안 도착",
  revision_requested: "수정 요청",
  completed: "완료",
};

export const DESIGN_REQUEST_PAYMENT_STATUS_LABEL: Record<DesignRequestPaymentStatus, string> = {
  unpaid: "미결제",
  paid: "결제 완료",
  failed: "결제 실패",
  refunded: "환불",
};
