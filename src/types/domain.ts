import type { BrandImageStatus } from "@/lib/brandImageStatus";
import type { CardIndustryPayload } from "@/types/cardIndustry";

export type UserRole = "client" | "creator" | "admin" | "company_admin" | "teacher";

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  email_confirmed_at?: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  /** Supabase `profiles.is_partner`와 동기화 — 홍보 파트너 */
  is_partner?: boolean;
}

/** 랜딩형 디지털 명함 — 서비스 블록 한 줄 */
export type DigitalCardServiceLine = {
  title: string;
  body: string;
};

/** 공개 명함 신뢰 영역 — 고객 후기 한 건 */
export type TrustTestimonial = {
  quote: string;
  person_name: string;
  role: string;
};

/** 출력 템플릿 (QR·인쇄 카드 디자인) */
export type CardDesignType = "simple" | "business" | "emotional";

export interface BusinessCard {
  id: string;
  user_id: string;
  /** Legacy/alternate owner column used by some Supabase schemas. */
  owner_id?: string | null;
  /** Optional owner email for older email-keyed card rows. */
  owner_email?: string | null;
  slug: string;
  /** 매장형 주소 또는 영업시간·방문 안내 텍스트 */
  address?: string | null;
  /** 공유·히어로 미리보기 레이아웃 (person / store / location 등) */
  preview_card_type?: string | null;
  /** Legacy/alternate display-name column used by some card tables. */
  name?: string | null;
  brand_name: string;
  person_name: string;
  job_title: string;
  intro: string;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  blog_url: string | null;
  youtube_url: string | null;
  kakao_url: string | null;
  /** 오픈채팅·채널 등 카카오톡 상담 전용 링크 */
  kakao_chat_url?: string | null;
  theme: "navy" | "slate" | "midnight";
  is_public: boolean;
  /** 탈퇴·관리 목적 비활성 시 true — 공개 조회에서 제외 */
  is_archived?: boolean;
  archived_at?: string | null;
  created_at: string;
  expire_at?: string | null;
  status?: "active" | "expired" | "payment_required";
  promotion_enabled?: boolean;
  promotion_payment_status?: "unpaid" | "paid" | "failed" | "refunded";
  promotion_price?: number;
  /** Hero/SEO 한 줄 (비어 있으면 직함·소개로 보완) */
  tagline?: string | null;
  /** 이미지형·히어로 상단 큰 제목(한 줄 소개·상세와 별개) */
  marketing_title?: string | null;
  /** 공개 명함 절대 URL. 없으면 현재 origin + /c/{slug}로 생성 */
  publicUrl?: string | null;
  /** 신뢰 영역 갤러리 이미지 URL */
  gallery_urls?: string[] | null;
  /** 서비스 3~5개 */
  services?: DigitalCardServiceLine[] | null;
  /** 후기·성과 한 줄 (첫 번째 후기 인용과 동기화·API 호환) */
  trust_line?: string | null;
  /** 성과 수치 등 한 줄 (예: 100+ 명함 제작) — 로컬 우선, Supabase 미동기화 시 생략 */
  trust_metric?: string | null;
  /** 고객 후기 최대 2건 — 로컬 우선 */
  trust_testimonials?: TrustTestimonial[] | null;
  /** 히어로 브랜드 대표 이미지 (public URL) */
  imageUrl?: string | null;
  /** DB 컬럼 `image_url` — 우선 표시 */
  image_url?: string | null;
  /** DB 컬럼 `profile_image_url` */
  profile_image_url?: string | null;
  /** 카카오·OG 전용 대표 이미지 URL (있으면 공유 썸네일 우선) */
  og_image_url?: string | null;
  /** 선택 업종 표시명 (예: 세차장) — OG 제목·업종별 이미지 매칭 */
  industry?: string | null;
  /** 업종 선택 구조(일반·린코 소속 등) — Supabase `card_industry` JSON */
  card_industry?: CardIndustryPayload | null;
  /** 업종 템플릿 기본 히어로 이미지 절대 URL */
  auto_image_url?: string | null;
  /** 목록·레거시 스키마용 썸네일 URL */
  thumbnail_url?: string | null;
  /** 히어로 브랜드 대표 이미지 (DB 컬럼명, imageUrl과 동기화) */
  brand_image_url?: string | null;
  /** 검수 상태 — DB: pending_review | approved | rejected_manual (+ 편집기 클라이언트 전용 값 가능) */
  brand_image_status?: BrandImageStatus | null;
  /** private 버킷 `card-image-pending` 내 객체 경로 */
  brand_image_pending_path?: string | null;
  brand_image_reject_reason?: string | null;
  brand_image_pending_uploaded_at?: string | null;
  /** DB 컬럼 `image_status` 레거시 별칭 — `brand_image_status`와 동기화 */
  image_status?: string | null;
  /** 히어로 프레임 비율 라벨 (저장·재현용, 예: 16:9) */
  brand_image_frame_ratio?: string | null;
  /** 업로드·최적화 후 이미지의 CSS 배치 기준 픽셀 크기 */
  brand_image_natural_width?: number | null;
  brand_image_natural_height?: number | null;
  /** 1 = 전체가 보이는 contain 기준, 그 이상은 확대 */
  brand_image_zoom?: number | null;
  /** -1~1 정규화 이동 (프레임 대비 최대 허용 이동량에 대한 비율) */
  brand_image_pan_x?: number | null;
  brand_image_pan_y?: number | null;
  /** 구 카드 호환용 (natural 없을 때 cover 초점) */
  brand_image_object_position?: string | null;
  /** 공개 명함 QR PNG 저장 URL */
  qr_image_url?: string | null;
  /** 인쇄·QR 카드 출력 템플릿 */
  design_type?: CardDesignType;
}

export type CardLinkType = "custom" | "phone" | "email" | "kakao" | "youtube" | "blog" | "website";

export interface CardLink {
  id: string;
  card_id: string;
  label: string;
  type: CardLinkType;
  url: string;
  sort_order: number;
}

export interface CardView {
  id: string;
  card_id: string;
  viewed_at: string;
  referrer: string | null;
  user_agent: string | null;
  promoter_code?: string | null;
  /** 조회 출처 (예: nfc) */
  source?: string | null;
}

export interface CardClick {
  id: string;
  card_id: string;
  action_type: string;
  clicked_at: string;
}

export interface CardLinkVisit {
  id: string;
  card_id: string;
  slug: string;
  ref_code: string;
  visited_at: string;
  page_path: string;
  user_agent: string | null;
}

export interface CardPromotionLink {
  id: string;
  card_id: string;
  ref_code: string;
  type: "promotion";
  created_at: string;
}

export type PromotionApplicationStatus = "pending" | "approved" | "rejected";

export interface PromotionApplication {
  id: string;
  card_id: string;
  applicant_user_id: string;
  owner_user_id: string;
  status: PromotionApplicationStatus;
  promoter_code: string | null;
  promotion_url: string | null;
  created_at: string;
  approved_at: string | null;
  applicant_name?: string | null;
  applicant_email?: string | null;
  card_name?: string | null;
  card_slug?: string | null;
}

/** 공개 명함 /c/{slug} 방문 로그 (홍보 ref 추적) */
export interface CardVisitLog {
  id: string;
  card_id: string;
  card_slug: string;
  owner_user_id: string;
  promoter_code: string | null;
  /** 홍보 파트너 계정(auth.users.id) — `?partner=` 링크 */
  partner_user_id?: string | null;
  source: "direct" | "promotion";
  visitor_user_agent: string | null;
  visited_at: string;
}

export type ExpertType = "card_design" | "blog" | "video" | "program";
/** 동일 타입 에일리어스 (`CreatorProfile.creator_type`) — 라벨은 `@/lib/expertLabels`. */
export type CreatorType = ExpertType;

/** DB·관리 화면용 전문가 노출 상태 (나중 검수 기능 대비) */
export type ExpertStatus = "pending" | "active" | "hidden" | "rejected";

export interface ExpertPortfolioPublic {
  id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  link_url?: string | null;
  portfolio_type?: string | null;
}

export type ExpertRequestPurpose = "production" | "promotion" | "consult";

/** 전문가에게 직접 보내는 의뢰 상태 */
export type ExpertDirectRequestStatus =
  | "requested"
  | "discussing"
  | "accepted"
  | "completed"
  | "canceled";

/** 회원이 특정 전문가에게 보내는 직접 의뢰 (내 공간·전문가 모두 확인) */
export interface ExpertDirectRequest {
  id: string;
  requester_id: string;
  expert_id: string;
  request_purpose: ExpertRequestPurpose;
  /** 선택 제목 요약 */
  title?: string | null;
  /** 폼에서 선택한 작업 카테고리(명함·블로그 등 라벨) */
  work_category?: string | null;
  description: string;
  reference_link?: string | null;
  budget?: number | null;
  due_date?: string | null;
  contact?: string | null;
  attachment_url?: string | null;
  status: ExpertDirectRequestStatus;
  created_at: string;
  requester_name?: string | null;
}

export interface CreatorProfile {
  id: string;
  user_id: string | null;
  creator_type: CreatorType;
  /** 한 줄 소개 */
  intro: string;
  /** 상세 소개 (상세 페이지) */
  bio_detail?: string | null;
  portfolio_url: string | null;
  portfolio_items_json: string[] | null;
  /** 구조화된 포트폴리오 카드 목록 */
  portfolios_rich_json?: ExpertPortfolioPublic[] | null;
  /** 어떤 일을 잘하는지 · 적합 고객 · 작업 방식 등 (상세) */
  who_for_text?: string | null;
  work_style_text?: string | null;
  min_price: number | null;
  region: string | null;
  /** 활동 가능 시간 문구 */
  available_time_text?: string | null;
  /** 주요 작업 분야 */
  categories_json: string[] | null;
  /** 제공 서비스 라벨 (유형별로 필터링해 표시) */
  offered_services_json?: string[] | null;
  /** 희망 받는 의뢰유형 신청 시 기록 제작·홍보·둘다 */
  request_channels_json?: ("production" | "promotion")[] | null;
  /** 유형별 추가 필드(JSON) 신청폼 원본 저장 */
  type_facets_json?: Record<string, unknown> | null;
  is_verified: boolean;
  expert_status?: ExpertStatus;
  created_at: string;
  portfolio_count_override?: number | null;
  review_count?: number;
  rating_avg?: number | null;
  /** 노출 순·필터: 의뢰 받음 여부 */
  accepting_requests?: boolean;
  /** Denormalized for directory UI when using mock store */
  display_name?: string;
}

export type ServiceRequestType = "blog" | "youtube" | "shortform" | "thumbnail";

export type ServiceRequestStatus =
  | "open"
  | "matched"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface ServiceRequest {
  id: string;
  client_user_id: string;
  request_type: ServiceRequestType;
  title: string;
  description: string;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  status: ServiceRequestStatus;
  created_at: string;
  client_name?: string;
}

export type ApplicationStatus = "pending" | "accepted" | "rejected";

export interface ServiceApplication {
  id: string;
  request_id: string;
  creator_user_id: string;
  proposal_text: string;
  proposed_price: number | null;
  estimated_days: number | null;
  status: ApplicationStatus;
  created_at: string;
  creator_name?: string;
  request_title?: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
}

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  payment_type: string;
  status: string;
  created_at: string;
  card_id?: string | null;
}

export type DesignRequestStyle = "simple" | "premium" | "emotional" | "business" | "free";

export type DesignRequestStatus =
  | "pending_payment"
  | "paid"
  | "assigned"
  | "draft_submitted"
  | "revision_requested"
  | "completed";

export type DesignRequestPaymentStatus = "unpaid" | "paid" | "failed" | "refunded";

export interface DesignRequest {
  id: string;
  user_id: string | null;
  name: string;
  phone: string;
  email: string;
  verified_name: string;
  verified_phone: string;
  verified_email: string;
  email_verified: boolean;
  business_type: string;
  style: DesignRequestStyle;
  reference_url: string | null;
  request_message: string;
  status: DesignRequestStatus;
  payment_status: DesignRequestPaymentStatus;
  assigned_designer_id: string | null;
  draft_image_url: string | null;
  final_card_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReferralRecord {
  user_id: string;
  ref_code: string;
  referred_by: string | null;
  referred_count: number;
  reward_months: number;
}

export interface MainBanner {
  id: string;
  title: string;
  subtitle: string;
  cta_label: string;
  cta_href: string;
  sort_order: number;
}

/** 교육 과정 카탈로그 (educations) */
export type EducationCategory = "card_design" | "blog" | "video" | "program" | "ai_creation";
export type EducationMethod = "online" | "offline" | "hybrid";
export type EducationOfferingStatus = "draft" | "open" | "closed" | "completed";

export interface EducationOffering {
  id: string;
  title: string;
  category: EducationCategory;
  method: EducationMethod;
  /** teachers.id */
  teacher_id: string | null;
  teacher_display_name: string;
  description: string;
  curriculum: string;
  materials_needed: string;
  location: string;
  schedule_summary: string;
  start_time: string | null;
  end_time: string | null;
  price: number;
  max_students: number;
  status: EducationOfferingStatus;
  enrolling: boolean;
  created_at: string;
}

/** 교육 신청 건 (education_applications) */
export type CourseEnrollmentStatus = "applied" | "reviewing" | "approved" | "waiting" | "canceled" | "completed";

export interface EducationApplication {
  id: string;
  education_id: string | null;
  user_id: string | null;
  name: string;
  phone: string;
  email: string;
  preferred_course_label: string;
  participation_method: "online" | "offline";
  message: string;
  status: CourseEnrollmentStatus;
  created_at: string;
}

export type TeacherApplicationStatus = "pending" | "reviewing" | "approved" | "rejected";

export interface TeacherApplication {
  id: string;
  user_id: string | null;
  name: string;
  phone: string;
  email: string;
  region: string;
  available_method: "online" | "offline" | "both";
  categories: EducationCategory[];
  topics: string;
  career: string;
  portfolio_url: string;
  desired_time: string;
  desired_price: string;
  introduction: string;
  attachment_url: string | null;
  status: TeacherApplicationStatus;
  created_at: string;
  type_facets_json?: Record<string, unknown> | null;
}

export type TeacherProfileStatus = "active" | "hidden" | "suspended";

export interface TeacherProfile {
  id: string;
  user_id: string;
  name: string;
  categories: EducationCategory[];
  region: string;
  available_method: "online" | "offline" | "both";
  bio: string;
  status: TeacherProfileStatus;
  created_at: string;
}

/** 홍보 풀에 올라간 명함 — 홍보 파트너에게 노출 */
export interface PromotionPoolEntry {
  id: string;
  card_id: string;
  slug: string;
  brand_name: string;
  person_name: string;
  registered_at: string;
  status: "active" | "paused";
}

/** 홍보 파트너 참여 등록 */
export interface PromoterParticipation {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  enrolled_at: string;
}
