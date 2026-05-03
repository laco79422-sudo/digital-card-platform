import { getOrCreatePromotionVisitorId } from "@/lib/cardPromoTracking";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

let lastSubmittedRpcUserId: string | null = null;

/** 가입 디바이스 흔적(익명 UUID + UA). 서버 휴리스틱은 RPC 내부에서 처리합니다. */
export async function submitSignupSignalForAuthenticatedUser(userId: string): Promise<void> {
  if (!userId || !isSupabaseConfigured || !supabase) return;

  const deviceId = getOrCreatePromotionVisitorId()?.trim();
  if (!deviceId || deviceId.length < 8) return;

  if (lastSubmittedRpcUserId === userId) return;

  const ua = typeof navigator !== "undefined" ? navigator.userAgent.trim() || null : null;

  const { error } = await supabase.rpc("register_signup_signal", {
    p_device_id: deviceId,
    p_user_agent: ua,
    p_ip_address: null,
    p_meta: {},
  });

  if (error) {
    console.warn("[signupSignalsRemote] register_signup_signal", error.message);
    return;
  }

  lastSubmittedRpcUserId = userId;
}

export function resetSignupSignalSubmitCache(): void {
  lastSubmittedRpcUserId = null;
}
