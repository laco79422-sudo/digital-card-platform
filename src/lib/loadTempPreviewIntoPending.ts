import { mergeDraftDefaults } from "@/stores/cardEditorDraftStore";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { savePendingCardDraft, type PendingCardLinkRow } from "@/lib/pendingCardStorage";
import type { CardEditorDraft } from "@/stores/cardEditorDraftStore";

type RemotePayload = {
  draft: Partial<CardEditorDraft> & { services?: CardEditorDraft["services"] };
  linkRows?: PendingCardLinkRow[];
};

/** Load synced temp payload from Supabase into session pending draft (link recipient signup/login). */
export async function loadTempPreviewIntoPending(tempId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase || !tempId.trim()) return false;

  const { data, error } = await supabase
    .from("linko_temp_previews")
    .select("payload")
    .eq("id", tempId.trim())
    .maybeSingle();

  if (error || !data?.payload) return false;

  const p = data.payload as RemotePayload;
  if (!p?.draft) return false;

  savePendingCardDraft({
    draft: mergeDraftDefaults(p.draft),
    linkRows: Array.isArray(p.linkRows) ? p.linkRows : [],
    tempId: tempId.trim(),
  });
  return true;
}
