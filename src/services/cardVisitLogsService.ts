import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import type { CardVisitLog } from "@/types/domain";

const TABLE = "card_visit_logs";

export async function insertCardVisitLog(row: {
  card_id: string;
  card_slug: string;
  owner_user_id: string;
  promoter_code: string | null;
  source: "direct" | "promotion";
  visitor_user_agent: string | null;
}): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const { error } = await supabase.from(TABLE).insert({
    card_id: row.card_id,
    card_slug: row.card_slug,
    owner_user_id: row.owner_user_id,
    promoter_code: row.promoter_code,
    source: row.source,
    visitor_user_agent: row.visitor_user_agent,
  });
  if (error) {
    console.warn("[cardVisitLogsService] insertCardVisitLog", error.message);
    return false;
  }
  return true;
}

export async function fetchCardVisitLogsForOwner(ownerUserId: string): Promise<CardVisitLog[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("owner_user_id", ownerUserId)
    .order("visited_at", { ascending: false });
  if (error) {
    console.warn("[cardVisitLogsService] fetchCardVisitLogsForOwner", error.message);
    return null;
  }
  return data as CardVisitLog[];
}

/** 승인된 내 promoter_code에 해당하는 방문만 */
export async function fetchCardVisitLogsForPromoterApplicant(
  _applicantUserId: string,
  promoterCodes: string[],
): Promise<CardVisitLog[] | null> {
  if (!isSupabaseConfigured || !supabase || promoterCodes.length === 0) return [];
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .in("promoter_code", promoterCodes)
    .order("visited_at", { ascending: false });
  if (error) {
    console.warn("[cardVisitLogsService] fetchCardVisitLogsForPromoterApplicant", error.message);
    return null;
  }
  return data as CardVisitLog[];
}
