const EDITOR_LIVE_CARD_KEY = "linko-editor-live-card-id";

export function getEditorLiveCardId(): string | null {
  try {
    return sessionStorage.getItem(EDITOR_LIVE_CARD_KEY);
  } catch {
    return null;
  }
}

export function setEditorLiveCardId(cardId: string) {
  try {
    sessionStorage.setItem(EDITOR_LIVE_CARD_KEY, cardId);
  } catch {
    /* ignore */
  }
}

export function clearEditorLiveCardId() {
  try {
    sessionStorage.removeItem(EDITOR_LIVE_CARD_KEY);
  } catch {
    /* ignore */
  }
}
