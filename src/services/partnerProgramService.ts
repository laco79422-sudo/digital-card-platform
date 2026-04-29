import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

export async function fetchProfilePartnerFlagRemote(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const { data, error } = await supabase.from("profiles").select("is_partner").eq("id", userId).maybeSingle();
  if (error) {
    console.warn("[partnerProgramService] profiles.is_partner", error.message);
    return false;
  }
  return Boolean(data?.is_partner);
}

export async function activatePartnerProgramRemote(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const { error } = await supabase.rpc("activate_partner_program");
  if (error) {
    console.warn("[partnerProgramService] activate_partner_program", error.message);
    return false;
  }
  return true;
}

export type PartnerDashboardSnapshot = {
  visit_logs_count?: number;
  card_views_count?: number;
  total_views?: number;
  click_count?: number;
  reservation_count?: number;
  payment_count?: number;
  partner_revenue_krw?: number;
  promoted_cards?: { id: string; slug: string; person_name: string | null; brand_name: string | null }[];
  error?: string;
};

export async function fetchPartnerDashboardSnapshotRemote(): Promise<PartnerDashboardSnapshot | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.rpc("partner_dashboard_snapshot");
  if (error) {
    console.warn("[partnerProgramService] partner_dashboard_snapshot", error.message);
    return null;
  }
  if (!data || typeof data !== "object") return null;
  const raw = data as Record<string, unknown>;
  const promoted = raw.promoted_cards;
  return {
    ...raw,
    promoted_cards: Array.isArray(promoted) ? (promoted as PartnerDashboardSnapshot["promoted_cards"]) : [],
  } as PartnerDashboardSnapshot;
}

export type PartnerLeaderboardRow = {
  leaderboard_rank: number;
  partner_user_id: string;
  connection_score: number;
};

export async function fetchPartnerLeaderboardRemote(limit = 30): Promise<PartnerLeaderboardRow[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase.rpc("partner_connection_leaderboard", { p_limit: limit });
  if (error) {
    console.warn("[partnerProgramService] partner_connection_leaderboard", error.message);
    return [];
  }
  const rows = Array.isArray(data) ? data : [];
  return rows.map((r: Record<string, unknown>) => ({
    leaderboard_rank: Number(r.leaderboard_rank ?? 0),
    partner_user_id: String(r.partner_user_id ?? ""),
    connection_score: Number(r.connection_score ?? 0),
  }));
}
