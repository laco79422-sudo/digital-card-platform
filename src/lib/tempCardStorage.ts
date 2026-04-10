import type { PendingCardLinkRow } from "@/lib/pendingCardStorage";
import type { CardEditorDraft } from "@/stores/cardEditorDraftStore";

const PREFIX = "linko-temp-card:";

export type TempCardPayload = {
  draft: CardEditorDraft;
  linkRows: PendingCardLinkRow[];
  updatedAt: string;
};

export function saveTempCard(tempId: string, payload: Omit<TempCardPayload, "updatedAt">) {
  try {
    const data: TempCardPayload = {
      ...payload,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(PREFIX + tempId, JSON.stringify(data));
  } catch {
    /* ignore quota / private mode */
  }
}

export function loadTempCard(tempId: string): TempCardPayload | null {
  try {
    const raw = localStorage.getItem(PREFIX + tempId);
    if (!raw) return null;
    return JSON.parse(raw) as TempCardPayload;
  } catch {
    return null;
  }
}

export function removeTempCard(tempId: string) {
  try {
    localStorage.removeItem(PREFIX + tempId);
  } catch {
    /* ignore */
  }
}
