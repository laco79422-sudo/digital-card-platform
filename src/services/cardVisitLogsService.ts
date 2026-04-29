import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import type { CardVisitLog } from "@/types/domain";

const TABLE = "card_visit_logs";

function isLikelyMissingRelation(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("does not exist") ||
    m.includes("could not find") ||
    m.includes("schema cache") ||
    m.includes("pgrst205")
  );
}

export async function insertCardVisitLog(row: {
  card_id: string;
  card_slug: string;
  owner_user_id: string;
  promoter_code: string | null;
  partner_user_id?: string | null;
  source: "direct" | "promotion";
  visitor_user_agent: string | null;
}): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const payload: Record<string, unknown> = {
      card_id: row.card_id,
      card_slug: row.card_slug,
      owner_user_id: row.owner_user_id,
      promoter_code: row.promoter_code,
      source: row.source,
      visitor_user_agent: row.visitor_user_agent,
    };
    if (row.partner_user_id) payload.partner_user_id = row.partner_user_id;
    const { error } = await supabase.from(TABLE).insert(payload);
    if (error) {
      if (!isLikelyMissingRelation(error.message)) {
        console.error("[cardVisitLogsService] insertCardVisitLog", error.message, error);
      }
      return false;
    }
    return true;
  } catch (e) {
    console.error("[cardVisitLogsService] insertCardVisitLog unexpected", e);
    return false;
  }
}

export async function fetchCardVisitLogsForOwner(ownerUserId: string): Promise<CardVisitLog[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("owner_user_id", ownerUserId)
      .order("visited_at", { ascending: false });
    if (error) {
      if (!isLikelyMissingRelation(error.message)) {
        console.error("[cardVisitLogsService] fetchCardVisitLogsForOwner", error.message, error);
      }
      return null;
    }
    return data as CardVisitLog[];
  } catch (e) {
    console.error("[cardVisitLogsService] fetchCardVisitLogsForOwner unexpected", e);
    return null;
  }
}

/** 승인된 내 promoter_code에 해당하는 방문만 */
export async function fetchCardVisitLogsForPromoterApplicant(
  _applicantUserId: string,
  promoterCodes: string[],
): Promise<CardVisitLog[] | null> {
  if (!isSupabaseConfigured || !supabase || promoterCodes.length === 0) return [];
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .in("promoter_code", promoterCodes)
      .order("visited_at", { ascending: false });
    if (error) {
      if (!isLikelyMissingRelation(error.message)) {
        console.error("[cardVisitLogsService] fetchCardVisitLogsForPromoterApplicant", error.message, error);
      }
      return null;
    }
    return data as CardVisitLog[];
  } catch (e) {
    console.error("[cardVisitLogsService] fetchCardVisitLogsForPromoterApplicant unexpected", e);
    return null;
  }
}
