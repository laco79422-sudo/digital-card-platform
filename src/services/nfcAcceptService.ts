import { normalizeBusinessCardRow } from "@/lib/businessCardRow";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import type { BusinessCard } from "@/types/domain";

const TABLE_PRIMARY = "business_cards";

export function isUuid(id: string): boolean {
  const s = id.trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

/** NFC 수락 화면에서 카드 미리보기용 — business_cards 만 조회 */
export async function fetchCardByIdForNfc(cardId: string): Promise<BusinessCard | null> {
  if (!isSupabaseConfigured || !supabase || !isUuid(cardId)) return null;
  try {
    const { data, error } = await supabase.from(TABLE_PRIMARY).select("*").eq("id", cardId.trim()).maybeSingle();
    if (error) {
      console.error("[nfcAcceptService] fetchCardByIdForNfc", error.message, error);
      return null;
    }
    if (!data) return null;
    return normalizeBusinessCardRow(data as Record<string, unknown>);
  } catch (e) {
    console.error("[nfcAcceptService] fetchCardByIdForNfc unexpected", e);
    return null;
  }
}

export type NfcAcceptLogStatus = "accepted" | "declined";

export async function insertNfcAcceptLog(params: {
  card_id: string;
  status: NfcAcceptLogStatus;
  source?: string;
  user_agent?: string | null;
}): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase.from("nfc_accept_logs").insert({
      card_id: params.card_id,
      status: params.status,
      source: params.source ?? "nfc",
      user_agent: params.user_agent ?? null,
    });
    if (error) {
      console.error("[nfcAcceptService] insertNfcAcceptLog", error.message, error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[nfcAcceptService] insertNfcAcceptLog unexpected", e);
    return false;
  }
}
