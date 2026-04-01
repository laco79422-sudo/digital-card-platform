import { APP_LAST_ACTIVITY_AT_KEY } from "@/lib/auth/inactivityConstants";

export function readLastActivityMs(): number | null {
  try {
    const raw = localStorage.getItem(APP_LAST_ACTIVITY_AT_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function writeActivityTimestamp(ms: number): void {
  try {
    localStorage.setItem(APP_LAST_ACTIVITY_AT_KEY, String(ms));
  } catch {
    /* ignore */
  }
}

export function clearLastActivity(): void {
  try {
    localStorage.removeItem(APP_LAST_ACTIVITY_AT_KEY);
  } catch {
    /* ignore */
  }
}
