import { z } from "zod";

/** 이름 미입력 시 (실시간 DB 조회 없음) */
export const signupNameMessages = {
  required: "이름을 입력해 주세요.",
} as const;

/**
 * 이메일: 빈 값·형식 오류만 안내합니다.
 * (중복 여부는 가입 버튼 → supabase.auth.signUp 결과로만 처리합니다. DB RPC 사용 안 함)
 */
export const signupEmailHint = {
  empty: "가입에 사용할 이메일을 입력해 주세요.",
  invalidFormat: "올바른 이메일 형식이 아닙니다.",
} as const;

/** 비밀번호 최소 길이 (Supabase·폼 공통) */
export const SIGNUP_PASSWORD_MIN_LENGTH = 8;

export const signupPasswordMessages = {
  tooShort: "비밀번호는 8자 이상이어야 합니다.",
} as const;

const emailSchema = z.string().email();

export type SignupEmailFieldStatus = "empty" | "invalid" | "valid";

/**
 * 이메일 입력 문자열을 기준으로 안내 상태만 구합니다.
 * (실제 중복 여부는 supabase.auth.signUp 결과로만 알 수 있습니다.)
 */
export function getSignupEmailFieldStatus(raw: string): SignupEmailFieldStatus {
  const t = raw.trim();
  if (!t) return "empty";
  if (!emailSchema.safeParse(t).success) return "invalid";
  return "valid";
}
