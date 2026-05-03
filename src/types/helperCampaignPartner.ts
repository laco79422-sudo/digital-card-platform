/** Supabase 헬퍼링크 파트너 플로우 타입 */

export type HelperCampaignStatus = "draft" | "recruiting" | "active" | "completed" | "canceled";


export type HelperPartnerProfileStatus = "pending" | "approved" | "rejected" | "suspended";

export type HelperPartnerApplicationStatus = "applied" | "selected" | "rejected" | "canceled" | "completed";

export type CampaignShareLinkStatus = "active" | "paused" | "completed";

export type HelperConsultationStatus = "new" | "in_progress" | "done" | "contract" | "cancelled";

/** DB helper_campaigns */
export interface HelperCampaignRow {
  id: string;
  owner_id: string;
  card_id: string;
  payment_id: string | null;
  title: string;
  target_channels: unknown;
  target_customer: string;
  region: string;
  goal: string;
  required_message: string;
  forbidden_message: string;
  budget: string;
  start_date: string | null;
  end_date: string | null;
  owner_note_for_partner: string;
  request_note: string;
  custom_channel_text: string;
  custom_goal_text: string;
  price: number;
  status: HelperCampaignStatus;
  created_at: string;
  updated_at: string;
}

export interface HelperPartnerRow {
  id: string;
  user_id: string;
  display_name: string;
  region: string;
  channels: unknown;
  channel_detail: string;
  experience: string;
  strategy: string;
  can_consult: boolean;
  available_time: string;
  bio: string;
  terms_ack_at: string | null;
  referrer_signup_count_at_apply: number;
  status: HelperPartnerProfileStatus;
  created_at: string;
  updated_at: string;
}

export interface HelperPartnerApplicationRow {
  id: string;
  campaign_id: string;
  partner_id: string;
  proposed_channels: unknown;
  promotion_method: string;
  target_audience: string;
  estimated_period: string;
  can_consult: boolean;
  proposal_message: string;
  status: HelperPartnerApplicationStatus;
  partner_message: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignShareLinkRow {
  id: string;
  campaign_id: string;
  partner_id: string;
  card_id: string;
  channel_id: string | null;
  /** HELPER_PROMO_CHANNELS id — URL의 channel 은 보통 campaign_share_links 행 UUID */
  promo_channel_key: string;
  share_url: string;
  status: CampaignShareLinkStatus;
  created_at: string;
}

/** card_events Supabase row — 대시보드 집계용 최소 필드 */
export type HelperCardEventLean = {
  event_type: string;
  helper_partner_id: string | null;
  campaign_share_link_id: string | null;
  created_at: string;
};

export type HelperCampaignStatsComputed = {
  totalViews: number;
  inquiryClicks: number;
  formSubmits: number;
  consultationRows: number;
  lastEventAt: string | null;
  byChannelKey: Record<string, { views: number; inquiryClicks: number }>;
  byPartnerId: Record<
    string,
    { name: string; views: number; inquiryClicks: number; formSubmits: number; consultations: number }
  >;
  selectedPartnerIds: string[];
};