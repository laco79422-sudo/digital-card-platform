const INSTANT_CARD_ID_KEY = "linko-instant-card-id";

export function setInstantCardId(cardId: string) {
  try {
    sessionStorage.setItem(INSTANT_CARD_ID_KEY, cardId);
  } catch {
    /* ignore */
  }
}

export function peekInstantCardId(): string | null {
  try {
    return sessionStorage.getItem(INSTANT_CARD_ID_KEY);
  } catch {
    return null;
  }
}

export function clearInstantCardId() {
  try {
    sessionStorage.removeItem(INSTANT_CARD_ID_KEY);
  } catch {
    /* ignore */
  }
}

export function consumeInstantCardId(): string | null {
  const id = peekInstantCardId();
  clearInstantCardId();
  return id;
}
