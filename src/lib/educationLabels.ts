import type {
  CourseEnrollmentStatus,
  EducationCategory,
  EducationMethod,
  EducationOfferingStatus,
  TeacherApplicationStatus,
} from "@/types/domain";

export const EDUCATION_CATEGORY_LABEL: Record<EducationCategory, string> = {
  card_design: "명함디자인 교육",
  blog: "블로그 교육",
  video: "영상제작 교육",
  program: "프로그램 제작 교육",
  ai_creation: "AI 제작교육",
};

export const EDUCATION_METHOD_LABEL: Record<EducationMethod, string> = {
  online: "온라인",
  offline: "오프라인",
  hybrid: "온·오프라인 병행",
};

export const EDUCATION_OFFERING_STATUS_LABEL: Record<EducationOfferingStatus, string> = {
  draft: "준비중",
  open: "모집중",
  closed: "마감",
  completed: "종료",
};

export const COURSE_ENROLLMENT_STATUS_LABEL: Record<CourseEnrollmentStatus, string> = {
  applied: "신청완료",
  reviewing: "확인중",
  approved: "승인",
  waiting: "대기",
  canceled: "취소",
  completed: "수강완료",
};

export const TEACHER_APPLICATION_STATUS_LABEL: Record<TeacherApplicationStatus, string> = {
  pending: "접수",
  reviewing: "검토중",
  approved: "선정",
  rejected: "반려",
};

export const TEACHER_METHOD_LABEL = {
  online: "온라인",
  offline: "오프라인",
  both: "둘 다 가능",
} as const;

export const EDUCATION_CATEGORY_ORDER: EducationCategory[] = [
  "card_design",
  "blog",
  "video",
  "program",
  "ai_creation",
];
