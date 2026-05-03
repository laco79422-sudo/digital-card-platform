import { getOrCreatePromotionVisitorId } from "@/lib/cardPromoTracking";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

/**
 * 코드별 세션 로그 플래그. 서버에서는 `visitor_client_id`로 중복을 막습니다.
 */
export function referralVisitLoggedSessionKey(normalizedUpperCode: string): string {
  return `linko_referral_visit_logged:${normalizedUpperCode.trim().toUpperCase()}`;
}

/**
 * `/?ref=` 등 플랫폼 추천 유입을 기록합니다. 동일 브라우저·코드 세션에서는 1회만 RPC를 보냅니다.
 */
export async function maybeRecordReferralLinkVisit(
  refRaw: string | null | undefined,
  landingPath: string | null | undefined,
): Promise<void> {
  const trimmed = refRaw?.trim();
  if (!trimmed || trimmed.length < 4) return;

  const code = trimmed.toUpperCase();

  try {
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(referralVisitLoggedSessionKey(code))) {
      return;
    }
  } catch {
    return;
  }

  if (!isSupabaseConfigured || !supabase) return;

  const visitorClientIdRaw = getOrCreatePromotionVisitorId()?.trim();
  const visitorParsed =
    visitorClientIdRaw && /^[\da-f]{8}-[\da-f]{4}-[1-5][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(
      visitorClientIdRaw,
    )
      ? visitorClientIdRaw
      : null;

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const path = landingPath?.trim() || null;

  const { error } = await supabase.rpc("record_referral_link_visit", {
    p_code: code,
    p_landing_path: path,
    p_user_agent: ua || null,
    p_visitor_client_id: visitorParsed,
  });

  if (error) {
    console.warn("[referralClickTracking] record_referral_link_visit", error.message);
    return;
  }

  try {
    sessionStorage.setItem(referralVisitLoggedSessionKey(code), "true");
  } catch {
    /* ignore */
  }
}
