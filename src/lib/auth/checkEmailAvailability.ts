import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { z } from "zod";

/** 회원가입 이메일 필드용 안내 (UI와 submit 검증에서 공통 사용) */
export const SIGNUP_EMAIL_GUIDE_DEFAULT = "가입에 사용할 이메일을 입력해 주세요.";
export const SIGNUP_EMAIL_GUIDE_FORMAT = "올바른 이메일 형식이 아닙니다.";
export const SIGNUP_EMAIL_GUIDE_CHECKING = "이메일을 확인하고 있습니다...";
export const SIGNUP_EMAIL_GUIDE_AVAILABLE = "사용 가능한 이메일입니다.";

/** 이미 가입된 이메일(RPC·인라인 안내 전용 문구) */
export const SIGNUP_EMAIL_ALREADY_REGISTERED = "이미 가입된 이메일입니다.";

/** Supabase에 `is_email_registered` RPC가 없을 때(실시간 중복 확인 불가) */
export const SIGNUP_EMAIL_RPC_UNAVAILABLE =
  "실시간 중복 확인을 쓰려면 Supabase SQL에 is_email_registered 함수를 등록해 주세요. 등록 전에는 가입 버튼을 눌렀을 때만 중복 여부를 알 수 있어요.";

const emailFieldSchema = z.string().trim().email();

export function isValidSignupEmailFormat(value: string): boolean {
  const t = value.trim();
  if (!t) return false;
  return emailFieldSchema.safeParse(t).success;
}

/**
 * Supabase RPC `is_email_registered` 결과로 등록 여부를 조회합니다.
 * RPC가 프로젝트에 없거나 실패하면 `ok: false` — UI는 중립 안내만 유지하고 가입 시 서버에서 다시 검증합니다.
 */
export async function fetchIsEmailRegistered(
  email: string,
): Promise<{ ok: true; registered: boolean } | { ok: false }> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false };
  }
  const { data, error } = await supabase.rpc("is_email_registered", {
    p_email: email.trim(),
  });
  if (error) {
    console.warn("[auth] is_email_registered RPC:", error.message);
    return { ok: false };
  }
  return { ok: true, registered: Boolean(data) };
}
