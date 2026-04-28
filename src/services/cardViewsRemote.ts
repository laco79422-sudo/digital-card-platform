import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

export type InsertCardViewRemoteInput = {
  card_id: string;
  referrer?: string | null;
  user_agent?: string | null;
  promoter_code?: string | null;
  /** 예: nfc, 직접 링크 등 */
  source?: string | null;
};

/** Supabase `card_views`에 공개 명함 조회 1건 기록 (클라이언트 RLS insert 허용 전제) */
export async function insertCardViewRemote(row: InsertCardViewRemoteInput): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const payload: Record<string, unknown> = {
    card_id: row.card_id,
    referrer: row.referrer ?? null,
    user_agent: row.user_agent ?? null,
    promoter_code: row.promoter_code ?? null,
    source: row.source ?? null,
  };
  const { error } = await supabase.from("card_views").insert(payload);
  if (error) {
    console.warn("[cardViewsRemote] insertCardViewRemote", error.message);
    return false;
  }
  return true;
}
