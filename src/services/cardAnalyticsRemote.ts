import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

function isLikelyMissingRelation(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("does not exist") ||
    m.includes("could not find") ||
    m.includes("schema cache") ||
    m.includes("pgrst205")
  );
}

export async function insertCardActionLogRemote(row: {
  card_id: string;
  owner_user_id: string;
  action_type: string;
  action_label?: string | null;
  partner_user_id?: string | null;
}): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const payload: Record<string, unknown> = {
      card_id: row.card_id,
      owner_user_id: row.owner_user_id,
      action_type: row.action_type,
      action_label: row.action_label ?? null,
    };
    if (row.partner_user_id) payload.partner_user_id = row.partner_user_id;
    const { error } = await supabase.from("card_action_logs").insert(payload);
    if (error) {
      if (!isLikelyMissingRelation(error.message)) {
        console.error("[cardAnalyticsRemote] insertCardActionLogRemote", error.message);
      }
      return false;
    }
    return true;
  } catch (e) {
    console.error("[cardAnalyticsRemote] insertCardActionLogRemote unexpected", e);
    return false;
  }
}

export async function insertInquiryLogRemote(row: {
  card_id: string;
  owner_user_id: string;
  inquiry_type: string;
}): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase.from("inquiry_logs").insert({
      card_id: row.card_id,
      owner_user_id: row.owner_user_id,
      inquiry_type: row.inquiry_type,
    });
    if (error) {
      if (!isLikelyMissingRelation(error.message)) {
        console.error("[cardAnalyticsRemote] insertInquiryLogRemote", error.message);
      }
      return false;
    }
    return true;
  } catch (e) {
    console.error("[cardAnalyticsRemote] insertInquiryLogRemote unexpected", e);
    return false;
  }
}

export async function fetchRemoteCardViewCountForCards(cardIds: string[]): Promise<number | null> {
  if (!isSupabaseConfigured || !supabase || cardIds.length === 0) return null;
  try {
    const { count, error } = await supabase
      .from("card_views")
      .select("id", { count: "exact", head: true })
      .in("card_id", cardIds);
    if (error) {
      if (!isLikelyMissingRelation(error.message)) {
        console.warn("[cardAnalyticsRemote] fetchRemoteCardViewCountForCards", error.message);
      }
      return null;
    }
    return count ?? 0;
  } catch {
    return null;
  }
}

export async function fetchRemoteActionCountForOwner(ownerUserId: string): Promise<number | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { count, error } = await supabase
      .from("card_action_logs")
      .select("id", { count: "exact", head: true })
      .eq("owner_user_id", ownerUserId);
    if (error) {
      if (!isLikelyMissingRelation(error.message)) {
        console.warn("[cardAnalyticsRemote] fetchRemoteActionCountForOwner", error.message);
      }
      return null;
    }
    return count ?? 0;
  } catch {
    return null;
  }
}

/** 내 명함 목록 카드별 조회수·문의 로그 건수(테이블 없으면 조용히 null) */
export async function fetchRemoteStatsForCards(cardIds: string[]): Promise<Map<string, { views: number; inquiries: number }> | null> {
  if (!isSupabaseConfigured || !supabase || cardIds.length === 0) return null;
  const client = supabase;
  const uniq = [...new Set(cardIds.map((id) => id.trim()).filter(Boolean))];
  const out = new Map<string, { views: number; inquiries: number }>();

  await Promise.all(
    uniq.map(async (cardId) => {
      const [vr, iq] = await Promise.all([
        client.from("card_views").select("id", { count: "exact", head: true }).eq("card_id", cardId),
        client.from("inquiry_logs").select("id", { count: "exact", head: true }).eq("card_id", cardId),
      ]);
      if (vr.error && !isLikelyMissingRelation(vr.error.message)) {
        console.warn("[cardAnalyticsRemote] fetchRemoteStatsForCards views", vr.error.message);
      }
      if (iq.error && !isLikelyMissingRelation(iq.error.message)) {
        console.warn("[cardAnalyticsRemote] fetchRemoteStatsForCards inquiries", iq.error.message);
      }
      const views = vr.error && !isLikelyMissingRelation(vr.error.message) ? 0 : vr.count ?? 0;
      const inquiries = iq.error && !isLikelyMissingRelation(iq.error.message) ? 0 : iq.count ?? 0;
      out.set(cardId, { views, inquiries });
    }),
  );
  return out;
}

export async function fetchRemoteInquiryCountForOwner(ownerUserId: string): Promise<number | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { count, error } = await supabase
      .from("inquiry_logs")
      .select("id", { count: "exact", head: true })
      .eq("owner_user_id", ownerUserId);
    if (error) {
      if (!isLikelyMissingRelation(error.message)) {
        console.warn("[cardAnalyticsRemote] fetchRemoteInquiryCountForOwner", error.message);
      }
      return null;
    }
    return count ?? 0;
  } catch {
    return null;
  }
}
