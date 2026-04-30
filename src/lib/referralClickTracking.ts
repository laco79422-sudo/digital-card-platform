import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

/** 브라우저 탭 세션당 추천 메인 유입 로그 1회 */
export const LINKO_REFERRAL_VISIT_SESSION_KEY = "linko_referral_visit_logged";

/**
 * `/?ref=` 등으로 들어온 추천 유입을 `referral_link_visits`에 기록합니다.
 * 같은 세션(`sessionStorage`)에서는 1회만 서버에 기록합니다.
 */
export async function maybeRecordReferralLinkVisit(
  refRaw: string | null | undefined,
  landingPath: string | null | undefined,
): Promise<void> {
  const trimmed = refRaw?.trim();
  if (!trimmed || trimmed.length < 4) return;

  const code = trimmed.toUpperCase();

  try {
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(LINKO_REFERRAL_VISIT_SESSION_KEY)) return;
  } catch {
    return;
  }

  if (!isSupabaseConfigured || !supabase) return;

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const path = landingPath?.trim() || null;

  const { error } = await supabase.rpc("record_referral_link_visit", {
    p_code: code,
    p_landing_path: path,
    p_user_agent: ua || null,
  });

  if (error) {
    console.warn("[referralClickTracking] record_referral_link_visit", error.message);
    return;
  }

  try {
    sessionStorage.setItem(LINKO_REFERRAL_VISIT_SESSION_KEY, "true");
  } catch {
    /* ignore */
  }
}
