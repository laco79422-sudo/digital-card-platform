/** 채널·헬퍼·카드 이벤트 — 설계형 타입(Postgres snake_case 과 동일 필드 의미) */

export type PromoChannelPresetId =
  | "kakao"
  | "daangn"
  | "blog"
  | "youtube"
  | "acquaintances"
  | "instagram"
  | "sms"
  | "community"
  | "custom";

export type PromoShareType = "direct" | "helper";

export type CardPromoEventType =
  | "view"
  | "contact_click"
  | "call_click"
  | "kakao_click"
  | "form_submit";

export const PROMO_CHANNEL_OPTIONS: readonly { id: PromoChannelPresetId; label: string }[] = [
  { id: "kakao", label: "카카오톡" },
  { id: "daangn", label: "당근" },
  { id: "blog", label: "블로그" },
  { id: "youtube", label: "유튜브" },
  { id: "acquaintances", label: "지인" },
  { id: "instagram", label: "인스타" },
  { id: "sms", label: "문자" },
  { id: "community", label: "커뮤니티" },
  { id: "custom", label: "기타(직접 입력)" },
] as const;

/** 로컬·UI용 채널 행(DB card_channels 대응) */
export interface StoredCardPromotionChannel {
  id: string;
  user_id: string;
  card_id: string;
  name: string;
  type: PromoChannelPresetId;
  is_paid: boolean;
  created_at: string;
}

export interface StoredPromoHelper {
  id: string;
  user_id: string;
  name: string;
  status: "pending" | "active" | "disabled";
}

export interface StoredPromoHelperLink {
  id: string;
  helper_id: string;
  card_id: string;
  channel_id: string | null;
  share_url: string;
}

export interface CardPromoAnalyticsEventRow {
  id: string;
  card_id: string;
  user_id: string;
  channel_id: string | null;
  share_type: PromoShareType;
  helper_id: string | null;
  event_type: CardPromoEventType;
  button_type: string | null;
  visitor_id: string | null;
  created_at: string;
}
