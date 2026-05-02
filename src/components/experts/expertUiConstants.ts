import type { CreatorType, ExpertDirectRequestStatus } from "@/types/domain";

export const EXPERT_TYPE_VALUES: CreatorType[] = ["card_design", "blog", "video", "program"];

export const EXPERT_REQUEST_PURPOSE_LABEL = {
  production: "제작 의뢰",
  promotion: "홍보 의뢰",
  consult: "상담 문의",
} as const;

export const DIRECT_REQUEST_STATUS_LABEL: Record<ExpertDirectRequestStatus, string> = {
  requested: "접수됨",
  discussing: "조율 중",
  accepted: "진행 확정",
  completed: "완료",
  canceled: "취소",
};

export const WORK_CATEGORY_OPTIONS_BY_TYPE: Record<CreatorType, string[]> = {
  card_design: ["명함디자인 제작", "문구·카피 수정", "매장형 레이아웃", "상세 구조 설계"],
  blog: ["블로그 홍보", "SEO 롱폼", "브랜디드 스토리", "네이버 블로그 시리즈"],
  video: ["영상 제작", "숏폼·릴스 패키지", "유튜브 영상", "홍보 필름"],
  program: ["프로그램 제작", "웹 화면 추가", "업무 자동화", "관리자 페이지"],
};
