import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

export interface PublicRewardAd {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  target_url: string | null;
  ad_type: string;
}

export async function fetchPublicRewardAds(): Promise<{ ads: PublicRewardAd[]; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) return { ads: [], error: null };
  const { data, error } = await supabase.rpc("list_public_reward_ads");
  if (error) return { ads: [], error: error.message };
  return { ads: (data ?? []) as PublicRewardAd[], error: null };
}

export async function recordAdView(adId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.rpc("record_ad_view", { p_ad_id: adId });
}

export type ClaimAdResult =
  | { ok: true; rewardAmount: number; targetUrl: string | null }
  | { ok: false; code: string; message: string };

export async function claimAdClickReward(adId: string): Promise<ClaimAdResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, code: "config", message: "연결 설정을 확인할 수 없습니다." };
  }
  const { data, error } = await supabase.rpc("claim_ad_click_reward", { p_ad_id: adId });
  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("daily_limit"))
      return { ok: false, code: "daily_limit", message: "오늘 이 광고로 이미 포인트를 받았습니다." };
    if (msg.includes("own_ad"))
      return { ok: false, code: "own_ad", message: "본인이 등록한 광고에는 리워드가 적립되지 않습니다." };
    if (msg.includes("not_authenticated"))
      return { ok: false, code: "auth", message: "로그인이 필요합니다." };
    if (msg.includes("insufficient_budget") || msg.includes("ad_inactive") || msg.includes("ad_not_found")) {
      return { ok: false, code: "inactive", message: "광고가 종료되었거나 예산이 부족합니다." };
    }
    return { ok: false, code: "unknown", message: msg || "처리에 실패했습니다." };
  }
  const row = data as { reward_amount?: number; target_url?: string | null };
  return {
    ok: true,
    rewardAmount: typeof row.reward_amount === "number" ? row.reward_amount : 0,
    targetUrl: row.target_url ?? null,
  };
}

export async function fetchUserAdRewardBalance(userId: string): Promise<number> {
  if (!isSupabaseConfigured || !supabase) return 0;
  const { data, error } = await supabase
    .from("user_rewards")
    .select("amount")
    .eq("user_id", userId)
    .eq("source_type", "ad_click")
    .eq("status", "confirmed");
  if (error || !data) return 0;
  return data.reduce((s, r: { amount?: number }) => s + (typeof r.amount === "number" ? r.amount : 0), 0);
}

export interface AdvertiserAdRow {
  id: string;
  title: string;
  status: string;
  ad_type: string;
  budget: number;
  spent_budget: number;
  cost_per_click: number;
  reward_per_click: number;
  created_at: string;
}

export async function fetchMyAds(userId: string): Promise<{ ads: AdvertiserAdRow[]; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) return { ads: [], error: null };
  const { data, error } = await supabase
    .from("ads")
    .select("id,title,status,ad_type,budget,spent_budget,cost_per_click,reward_per_click,created_at")
    .eq("advertiser_user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return { ads: [], error: error.message };
  return { ads: (data ?? []) as AdvertiserAdRow[], error: null };
}

export async function fetchAdEventCounts(
  adIds: string[],
): Promise<Map<string, { views: number; clicks: number }>> {
  const map = new Map<string, { views: number; clicks: number }>();
  if (!isSupabaseConfigured || !supabase || adIds.length === 0) return map;
  for (const id of adIds) map.set(id, { views: 0, clicks: 0 });
  const { data, error } = await supabase.from("ad_events").select("ad_id,event_type").in("ad_id", adIds);
  if (error || !data) return map;
  for (const row of data as { ad_id: string; event_type: string }[]) {
    const cur = map.get(row.ad_id) ?? { views: 0, clicks: 0 };
    if (row.event_type === "view") cur.views += 1;
    else if (row.event_type === "click") cur.clicks += 1;
    map.set(row.ad_id, cur);
  }
  return map;
}

export async function createAdvertisement(payload: {
  advertiser_user_id: string;
  title: string;
  description?: string;
  image_url?: string;
  target_url?: string;
  ad_type: "banner" | "click_reward";
  budget: number;
  cost_per_click: number;
  reward_per_click: number;
}): Promise<{ id: string | null; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) return { id: null, error: "연결 설정을 확인할 수 없습니다." };
  const { data, error } = await supabase
    .from("ads")
    .insert({
      advertiser_user_id: payload.advertiser_user_id,
      title: payload.title.trim(),
      description: payload.description?.trim() || null,
      image_url: payload.image_url?.trim() || null,
      target_url: payload.target_url?.trim() || null,
      ad_type: payload.ad_type,
      budget: payload.budget,
      cost_per_click: payload.cost_per_click,
      reward_per_click: payload.reward_per_click,
    })
    .select("id")
    .single();
  if (error) return { id: null, error: error.message };
  return { id: data?.id ?? null, error: null };
}
