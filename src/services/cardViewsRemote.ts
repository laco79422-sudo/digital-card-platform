import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

export type InsertCardViewRemoteInput = {
  card_id: string;
  referrer?: string | null;
  user_agent?: string | null;
  promoter_code?: string | null;
  partner_user_id?: string | null;
  /** 예: nfc, 직접 링크 등 */
  source?: string | null;
};

function isLikelyMissingRelation(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("does not exist") ||
    m.includes("could not find") ||
    m.includes("schema cache") ||
    m.includes("pgrst205")
  );
}

/** Supabase `card_views`에 공개 명함 조회 1건 기록 — 테이블 없으면 조용히 무시 */
export async function insertCardViewRemote(row: InsertCardViewRemoteInput): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const payload: Record<string, unknown> = {
    card_id: row.card_id,
    referrer: row.referrer ?? null,
    user_agent: row.user_agent ?? null,
    promoter_code: row.promoter_code ?? null,
    source: row.source ?? null,
  };
  if (row.partner_user_id) payload.partner_user_id = row.partner_user_id;
  try {
    const { error } = await supabase.from("card_views").insert(payload);
    if (error) {
      if (!isLikelyMissingRelation(error.message)) {
        console.error("[cardViewsRemote] insertCardViewRemote", error.message, error);
      }
      return false;
    }
    return true;
  } catch (e) {
    console.error("[cardViewsRemote] insertCardViewRemote unexpected", e);
    return false;
  }
}
