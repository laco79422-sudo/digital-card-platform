import type { PendingCardLinkRow } from "@/lib/pendingCardStorage";
import type { CardEditorDraft } from "@/stores/cardEditorDraftStore";

const MAX_BODY = 450_000;

/**
 * POSTs draft to Netlify `sync-temp-preview` so crawlers can read per-preview OG on `/preview/{id}`.
 * Fails quietly in local Vite or when the function is not deployed.
 */
export async function syncTempPreviewRemote(payload: {
  tempId: string;
  draft: CardEditorDraft;
  linkRows: PendingCardLinkRow[];
}): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const { tempId, draft, linkRows } = payload;
  if (!tempId) return false;

  const body = JSON.stringify({ tempId, draft, linkRows });
  if (body.length > MAX_BODY) return false;

  try {
    const res = await fetch(`${window.location.origin}/.netlify/functions/sync-temp-preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (!res.ok && import.meta.env.DEV) {
      console.warn("[syncTempPreviewRemote]", res.status, await res.text().catch(() => ""));
    }
    return res.ok;
  } catch {
    /* Netlify 미사용·오프라인 */
    return false;
  }
}
