const GUEST_TEMP_ID_KEY = "linko-guest-temp-id";

export function getOrCreateGuestTempId(): string {
  try {
    let id = sessionStorage.getItem(GUEST_TEMP_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(GUEST_TEMP_ID_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

/** 샘플 재시작 등 새 임시 미리보기 세션 */
export function resetGuestTempId(): string {
  try {
    sessionStorage.removeItem(GUEST_TEMP_ID_KEY);
  } catch {
    /* ignore */
  }
  return getOrCreateGuestTempId();
}

export function clearGuestTempId(): void {
  try {
    sessionStorage.removeItem(GUEST_TEMP_ID_KEY);
  } catch {
    /* ignore */
  }
}

/** pending 복원 시 세션과 동일한 임시 id로 맞춤 */
export function setGuestTempSessionId(id: string): void {
  try {
    sessionStorage.setItem(GUEST_TEMP_ID_KEY, id);
  } catch {
    /* ignore */
  }
}
