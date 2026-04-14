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
  shareUrl?: string;
  state?: "guest" | "preview" | "editor";
}): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const { tempId, draft, linkRows, shareUrl, state } = payload;
  if (!tempId) return false;

  const requestPayload = {
    tempId,
    previewId: tempId,
    draft,
    linkRows,
  };
  const body = JSON.stringify(requestPayload);
  if (body.length > MAX_BODY) return false;

  console.info("[syncTempPreviewRemote] request", {
    tempId,
    shareUrl: shareUrl ?? `${window.location.origin}/preview/${encodeURIComponent(tempId)}`,
    state: state ?? "editor",
    payload: requestPayload,
  });

  try {
    const res = await fetch(`${window.location.origin}/.netlify/functions/sync-temp-preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const responseText = await res.text().catch(() => "");
    if (!res.ok) {
      console.warn("[syncTempPreviewRemote] failed", {
        status: res.status,
        body: responseText,
      });
    } else if (import.meta.env.DEV) {
      console.info("[syncTempPreviewRemote] ok", { status: res.status, body: responseText });
    }
    return res.ok;
  } catch {
    /* Netlify 미사용·오프라인 */
    return false;
  }
}
