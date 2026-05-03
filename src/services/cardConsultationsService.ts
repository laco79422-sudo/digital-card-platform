import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

function missingRelation(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("does not exist") || m.includes("schema cache") || m.includes("could not find");
}

export async function insertCardConsultationRemote(row: {
  card_id: string;
  customer_name: string;
  customer_contact: string;
  message: string;
  campaign_id?: string | null;
  helper_partner_id?: string | null;
  channel_link_id?: string | null;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, message: "서버 설정이 필요합니다." };
  }
  const { error } = await supabase.from("consultations").insert({
    card_id: row.card_id,
    customer_name: row.customer_name.trim(),
    customer_contact: row.customer_contact.trim(),
    message: row.message.trim(),
    status: "new",
    campaign_id: row.campaign_id?.trim() || null,
    helper_partner_id: row.helper_partner_id?.trim() || null,
    channel_link_id: row.channel_link_id?.trim() || null,
  });
  if (error) {
    if (!missingRelation(error.message)) {
      console.warn("[cardConsultationsService]", error.message);
    }
    return { ok: false, message: error.message };
  }
  return { ok: true };
}
