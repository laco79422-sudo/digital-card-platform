import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

const SESSION_PREFIX = "referral_click_logged:";

export function referralClickSessionStorageKey(referralCode: string): string {
  return `${SESSION_PREFIX}${referralCode.trim().toUpperCase()}`;
}

/**
 * 같은 브라우저 세션에서 동일 추천 코드 클릭은 한 번만 서버에 기록합니다.
 */
export async function maybeRecordReferralClickFromUrl(refRaw: string | null | undefined): Promise<void> {
  const trimmed = refRaw?.trim();
  if (!trimmed || trimmed.length < 4) return;

  const code = trimmed.toUpperCase();
  const key = referralClickSessionStorageKey(code);

  try {
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(key)) return;
  } catch {
    return;
  }

  if (!isSupabaseConfigured || !supabase) return;

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const { error } = await supabase.rpc("record_referral_click", {
    p_code: code,
    p_user_agent: ua || null,
  });

  if (error) {
    console.warn("[referralClickTracking] record_referral_click", error.message);
    return;
  }

  try {
    sessionStorage.setItem(key, "1");
  } catch {
    /* ignore */
  }
}
