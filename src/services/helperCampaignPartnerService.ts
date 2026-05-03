/**
 * 헬퍼링크 파트너 캠페인 — Supabase 연동
 */
import { buildCampaignPartnerShareUrl } from "@/lib/helperCampaignPartnerUrls";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import type { BusinessCard } from "@/types/domain";
import type {
  CampaignShareLinkRow,
  HelperCampaignRow,
  HelperPartnerApplicationRow,
  HelperPartnerRow,
} from "@/types/helperCampaignPartner";

const T_CAMPAIGNS = "helper_campaigns";
const T_PARTNERS = "helper_partners";
const T_APPS = "helper_partner_applications";
const T_LINKS = "campaign_share_links";

/** 유료 헬퍼링크 상품 안내 금액(데모·결제창 연동 전) */
export const HELPER_LINK_CAMPAIGN_PRICE_KRW = 19900;

function asStringArr(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string").map(String);
  return [];
}

export async function fetchHelperCampaignsForOwner(ownerUserId: string): Promise<HelperCampaignRow[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from(T_CAMPAIGNS)
    .select("*")
    .eq("owner_id", ownerUserId)
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("[helperCampaignPartnerService] fetchHelperCampaignsForOwner", error.message);
    return [];
  }
  return (data as HelperCampaignRow[]) ?? [];
}

export async function fetchRecruitingHelperCampaigns(): Promise<HelperCampaignRow[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from(T_CAMPAIGNS)
    .select("*")
    .eq("status", "recruiting")
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("[helperCampaignPartnerService] fetchRecruitingHelperCampaigns", error.message);
    return [];
  }
  return (data as HelperCampaignRow[]) ?? [];
}

export async function fetchHelperPartnerProfileForUser(userId: string): Promise<HelperPartnerRow | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.from(T_PARTNERS).select("*").eq("user_id", userId).maybeSingle();
  if (error) {
    console.warn("[helperCampaignPartnerService] fetchHelperPartnerProfileForUser", error.message);
    return null;
  }
  return (data as HelperPartnerRow) ?? null;
}

export async function insertHelperPartnerProfile(row: {
  user_id: string;
  display_name: string;
  region: string;
  channels: string[];
  channel_detail: string;
  experience: string;
  strategy: string;
  can_consult: boolean;
  available_time: string;
  bio: string;
  terms_ack_at: string;
  referrer_signup_count_at_apply: number;
  status?: HelperPartnerRow["status"];
}): Promise<HelperPartnerRow | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const payload = {
    user_id: row.user_id,
    display_name: row.display_name,
    region: row.region,
    channels: row.channels,
    channel_detail: row.channel_detail,
    experience: row.experience,
    strategy: row.strategy,
    can_consult: row.can_consult,
    available_time: row.available_time,
    bio: row.bio,
    terms_ack_at: row.terms_ack_at,
    referrer_signup_count_at_apply: row.referrer_signup_count_at_apply,
    status: row.status ?? "pending",
  };
  const { data, error } = await supabase.from(T_PARTNERS).insert(payload).select("*").single();
  if (error) {
    console.warn("[helperCampaignPartnerService] insertHelperPartnerProfile", error.message);
    return null;
  }
  return data as HelperPartnerRow;
}

export async function insertHelperCampaignAfterPayment(input: {
  ownerId: string;
  cardId: string;
  paymentId?: string | null;
  title: string;
  targetChannels: string[];
  targetCustomer: string;
  region: string;
  goal: string;
  requiredMessage: string;
  forbiddenMessage: string;
  budget: string;
  startDate?: string | null;
  endDate?: string | null;
  ownerNoteForPartner: string;
}): Promise<HelperCampaignRow | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const payload = {
    owner_id: input.ownerId,
    card_id: input.cardId,
    payment_id: input.paymentId ?? null,
    title: input.title.trim() || "헬퍼링크 캠페인",
    target_channels: input.targetChannels,
    target_customer: input.targetCustomer.trim(),
    region: input.region.trim(),
    goal: input.goal.trim(),
    required_message: input.requiredMessage.trim(),
    forbidden_message: input.forbiddenMessage.trim(),
    budget: input.budget.trim(),
    start_date: input.startDate ?? null,
    end_date: input.endDate ?? null,
    owner_note_for_partner: input.ownerNoteForPartner.trim(),
    status: "recruiting" as const,
  };

  const { data, error } = await supabase.from(T_CAMPAIGNS).insert(payload).select("*").single();
  if (error) {
    console.warn("[helperCampaignPartnerService] insertHelperCampaignAfterPayment", error.message);
    return null;
  }
  return data as HelperCampaignRow;
}

export async function fetchApplicationsForCampaign(campaignId: string): Promise<HelperPartnerApplicationRow[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from(T_APPS)
    .select("*")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("[helperCampaignPartnerService] fetchApplicationsForCampaign", error.message);
    return [];
  }
  return (data as HelperPartnerApplicationRow[]) ?? [];
}

export async function insertPartnerCampaignApplication(row: {
  campaignId: string;
  partnerId: string;
  proposedChannels: string[];
  promotionMethod: string;
  targetAudience: string;
  estimatedPeriod: string;
  canConsult: boolean;
  proposalMessage: string;
}): Promise<HelperPartnerApplicationRow | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const payload = {
    campaign_id: row.campaignId,
    partner_id: row.partnerId,
    proposed_channels: row.proposedChannels,
    promotion_method: row.promotionMethod.trim(),
    target_audience: row.targetAudience.trim(),
    estimated_period: row.estimatedPeriod.trim(),
    can_consult: row.canConsult,
    proposal_message: row.proposalMessage.trim(),
    status: "applied" as const,
  };
  const { data, error } = await supabase.from(T_APPS).insert(payload).select("*").single();
  if (error) {
    console.warn("[helperCampaignPartnerService] insertPartnerCampaignApplication", error.message);
    return null;
  }
  return data as HelperPartnerApplicationRow;
}

export async function selectPartnerApplicationAndActivate(opts: {
  campaignId: string;
  applicationId: string;
  card: Pick<BusinessCard, "id" | "slug">;
  partnerProfileId: string;
}): Promise<CampaignShareLinkRow | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data: others } = await supabase.from(T_APPS).select("id").eq("campaign_id", opts.campaignId);
  const otherIds = (others ?? []).map((r: { id: string }) => r.id).filter((id) => id !== opts.applicationId);

  if (otherIds.length) {
    await supabase.from(T_APPS).update({ status: "rejected", updated_at: new Date().toISOString() }).in("id", otherIds);
  }

  await supabase
    .from(T_APPS)
    .update({ status: "selected", updated_at: new Date().toISOString() })
    .eq("id", opts.applicationId);

  const apps = await fetchApplicationsForCampaign(opts.campaignId);
  const selected = apps.find((a) => a.id === opts.applicationId);
  const chans = selected ? asStringArr(selected.proposed_channels) : [];
  const channelId = chans.find((c) => /^[0-9a-f-]{36}$/i.test(c)) ?? null;

  const slug = opts.card.slug?.trim();
  if (!slug) return null;

  const share_url = buildCampaignPartnerShareUrl({
    slug,
    campaignId: opts.campaignId,
    channelId,
    partnerProfileId: opts.partnerProfileId,
  });

  const { data: link, error: e3 } = await supabase
    .from(T_LINKS)
    .insert({
      campaign_id: opts.campaignId,
      partner_id: opts.partnerProfileId,
      card_id: opts.card.id,
      channel_id: channelId,
      share_url,
      status: "active",
    })
    .select("*")
    .single();

  if (e3) {
    console.warn("[helperCampaignPartnerService] insert share link", e3.message);
    return null;
  }

  await supabase
    .from(T_CAMPAIGNS)
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("id", opts.campaignId);

  return link as CampaignShareLinkRow;
}

export async function fetchShareLinksForOwner(ownerUserId: string): Promise<CampaignShareLinkRow[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data: campaigns, error } = await supabase.from(T_CAMPAIGNS).select("id").eq("owner_id", ownerUserId);
  if (error || !campaigns?.length) return [];

  const ids = campaigns.map((c: { id: string }) => c.id);
  const { data: links, error: e2 } = await supabase.from(T_LINKS).select("*").in("campaign_id", ids);
  if (e2) return [];
  return (links as CampaignShareLinkRow[]) ?? [];
}

export async function fetchShareLinksForPartner(partnerProfileId: string): Promise<CampaignShareLinkRow[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase.from(T_LINKS).select("*").eq("partner_id", partnerProfileId);
  if (error) return [];
  return (data as CampaignShareLinkRow[]) ?? [];
}

export async function fetchHelperPartnersByIds(ids: string[]): Promise<HelperPartnerRow[]> {
  const uniq = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  if (!isSupabaseConfigured || !supabase || uniq.length === 0) return [];
  const { data, error } = await supabase.from(T_PARTNERS).select("*").in("id", uniq);
  if (error) {
    console.warn("[helperCampaignPartnerService] fetchHelperPartnersByIds", error.message);
    return [];
  }
  return (data as HelperPartnerRow[]) ?? [];
}
