import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import type { BusinessCard } from "@/types/domain";

const TABLE_PRIMARY = "business_cards";
const TABLE_LEGACY = "cards";

export function isUuid(id: string): boolean {
  const s = id.trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

/** NFC 수락 화면에서 카드 미리보기용 — id로 business_cards 후 legacy cards 조회 */
export async function fetchCardByIdForNfc(cardId: string): Promise<BusinessCard | null> {
  if (!isSupabaseConfigured || !supabase || !isUuid(cardId)) return null;

  const primary = await supabase.from(TABLE_PRIMARY).select("*").eq("id", cardId.trim()).maybeSingle();
  if (!primary.error && primary.data) return primary.data as BusinessCard;

  const legacy = await supabase.from(TABLE_LEGACY).select("*").eq("id", cardId.trim()).maybeSingle();
  if (legacy.error || !legacy.data) {
    if (legacy.error) console.warn("[nfcAcceptService] fetchCardByIdForNfc legacy", legacy.error.message);
    return null;
  }
  return legacy.data as BusinessCard;
}

export type NfcAcceptLogStatus = "accepted" | "declined";

export async function insertNfcAcceptLog(params: {
  card_id: string;
  status: NfcAcceptLogStatus;
  source?: string;
  user_agent?: string | null;
}): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const { error } = await supabase.from("nfc_accept_logs").insert({
    card_id: params.card_id,
    status: params.status,
    source: params.source ?? "nfc",
    user_agent: params.user_agent ?? null,
  });
  if (error) {
    console.warn("[nfcAcceptService] insertNfcAcceptLog", error.message);
    return false;
  }
  return true;
}
