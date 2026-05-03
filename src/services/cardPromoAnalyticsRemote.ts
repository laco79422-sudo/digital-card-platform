import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

function missingRelation(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("does not exist") || m.includes("schema cache") || m.includes("could not find");
}

export async function insertCardPromoEventRemote(row: {
  card_id: string;
  user_id: string;
  campaign_id?: string | null;
  channel_id?: string | null;
  share_type: "direct" | "helper";
  helper_id?: string | null;
  helper_partner_id?: string | null;
  event_type: string;
  button_type?: string | null;
  visitor_id?: string | null;
}): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const payload: Record<string, unknown> = {
      card_id: row.card_id,
      user_id: row.user_id,
      campaign_id: row.campaign_id ?? null,
      channel_id: row.channel_id ?? null,
      share_type: row.share_type,
      helper_id: row.helper_id ?? null,
      helper_partner_id: row.helper_partner_id ?? null,
      event_type: row.event_type,
      button_type: row.button_type ?? null,
      visitor_id: row.visitor_id ?? null,
    };

    const { error } = await supabase.from("card_events").insert(payload);

    if (error) {
      if ((error as { code?: string }).code === "23505") return true;
      if (!missingRelation(error.message)) {
        console.warn("[cardPromoAnalyticsRemote]", error.message);
      }
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[cardPromoAnalyticsRemote] unexpected", e);
    return false;
  }
}
