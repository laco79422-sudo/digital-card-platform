export type UserRole = "client" | "creator" | "admin" | "company_admin";

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

/** 랜딩형 디지털 명함 — 서비스 블록 한 줄 */
export type DigitalCardServiceLine = {
  title: string;
  body: string;
};

export interface BusinessCard {
  id: string;
  user_id: string;
  slug: string;
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
  theme: "navy" | "slate" | "midnight";
  is_public: boolean;
  created_at: string;
  /** Hero/SEO 한 줄 (비어 있으면 직함·소개로 보완) */
  tagline?: string | null;
  /** 신뢰 영역 갤러리 이미지 URL */
  gallery_urls?: string[] | null;
  /** 서비스 3~5개 */
  services?: DigitalCardServiceLine[] | null;
  /** 후기·성과 한 줄 */
  trust_line?: string | null;
  /** 히어로 브랜드 대표 이미지 (URL 또는 data URL) */
  brand_image_url?: string | null;
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
}

export interface CardClick {
  id: string;
  card_id: string;
  action_type: string;
  clicked_at: string;
}

export type CreatorType =
  | "blog_writer"
  | "youtube_producer"
  | "shortform_editor"
  | "thumbnail_designer";

export interface CreatorProfile {
  id: string;
  user_id: string;
  creator_type: CreatorType;
  intro: string;
  portfolio_url: string | null;
  portfolio_items_json: string[] | null;
  min_price: number | null;
  region: string | null;
  categories_json: string[] | null;
  is_verified: boolean;
  created_at: string;
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
}

export interface MainBanner {
  id: string;
  title: string;
  subtitle: string;
  cta_label: string;
  cta_href: string;
  sort_order: number;
}

/** 교육 신청 (AI 블로그·영상 실전 교육) */
export type EducationInterest = "blog" | "video" | "both";

export interface EducationApplication {
  id: string;
  name: string;
  phone: string;
  email: string;
  interest: EducationInterest;
  message: string;
  created_at: string;
}

/** 강사 지원 */
export interface InstructorApplication {
  id: string;
  name: string;
  phone: string;
  email: string;
  specialty: string;
  lecture_topics: string;
  experience: string;
  portfolio_url: string;
  created_at: string;
}
