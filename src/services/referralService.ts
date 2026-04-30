import { clearStoredLinkoReferralCode, getStoredLinkoReferralCode } from "@/lib/linkoReferralStorage";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

export async function fetchProfileReferralCode(userId: string): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.from("profiles").select("referral_code").eq("id", userId).maybeSingle();
  if (error) {
    console.warn("[referralService] fetchProfileReferralCode", error.message);
    return null;
  }
  const code = data?.referral_code?.trim();
  return code || null;
}

export async function fetchReferralSignupCount(referrerUserId: string): Promise<number> {
  if (!isSupabaseConfigured || !supabase) return 0;
  const { count, error } = await supabase
    .from("referrals")
    .select("*", { count: "exact", head: true })
    .eq("referrer_user_id", referrerUserId);
  if (error) {
    console.warn("[referralService] fetchReferralSignupCount", error.message);
    return 0;
  }
  return count ?? 0;
}

/** 추천 링크 메인 유입(`referral_link_visits`) 건수 */
export async function fetchReferralLinkVisitCount(referrerUserId: string): Promise<number> {
  if (!isSupabaseConfigured || !supabase) return 0;
  const code = await fetchProfileReferralCode(referrerUserId);
  if (!code) return 0;
  const { count, error } = await supabase
    .from("referral_link_visits")
    .select("*", { count: "exact", head: true })
    .eq("referral_code", code.trim().toUpperCase());
  if (error) {
    console.warn("[referralService] fetchReferralLinkVisitCount", error.message);
    return 0;
  }
  return count ?? 0;
}

/** @deprecated {@link fetchReferralLinkVisitCount} 사용 */
export async function fetchReferralClickCount(referrerUserId: string): Promise<number> {
  return fetchReferralLinkVisitCount(referrerUserId);
}

export type ReferrerPreviewRow = { referral_code: string; display_name: string };

export async function fetchReferrerPreviewForSignup(rawCode: string | null): Promise<ReferrerPreviewRow | null> {
  if (!rawCode?.trim() || !isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.rpc("preview_referrer_for_signup", { p_code: rawCode.trim() });
  if (error) {
    console.warn("[referralService] preview_referrer_for_signup", error.message);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : null;
  if (!row || typeof row !== "object") return null;
  const rec = row as Record<string, unknown>;
  const referral_code = typeof rec.referral_code === "string" ? rec.referral_code : null;
  if (!referral_code) return null;
  const display_name = typeof rec.display_name === "string" ? rec.display_name : "";
  return { referral_code, display_name };
}

/** 세션이 있는 상태에서 추천 관계를 서버에 저장합니다. 성공 시 로컬 저장 코드를 제거합니다. */
export async function claimReferralForAuthenticatedUser(rawCode: string | null): Promise<boolean> {
  if (!rawCode?.trim() || !isSupabaseConfigured || !supabase) return false;
  const { error } = await supabase.rpc("claim_referral", { p_code: rawCode.trim().toUpperCase() });
  if (error) {
    console.warn("[referralService] claim_referral (authenticated)", error.message);
    return false;
  }
  clearStoredLinkoReferralCode();
  return true;
}

/** 로그인 세션 기준으로 저장된 추천 코드를 서버에 반영합니다. 성공 시 로컬 저장값을 지웁니다. */
export async function claimPendingReferral(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const code = getStoredLinkoReferralCode();
  if (!code) return false;

  const { data: sessionData } = await supabase.auth.getSession();
  const uid = sessionData.session?.user?.id;
  if (!uid) return false;

  const { error } = await supabase.rpc("claim_referral", { p_code: code });
  if (error) {
    console.warn("[referralService] claim_referral", error.message);
    return false;
  }

  clearStoredLinkoReferralCode();
  return true;
}
