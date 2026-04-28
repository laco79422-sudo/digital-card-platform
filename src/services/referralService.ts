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
