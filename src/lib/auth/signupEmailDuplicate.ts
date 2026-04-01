import type { User } from "@supabase/supabase-js";

/**
 * Supabase Auth는 이미 가입된 이메일로 `signUp` 할 때
 * 이메일 존재 여부를 숨기기 위해 **HTTP 200 + error 없음**으로 응답하는 경우가 있습니다.
 * 이때 `user`는 있으나 `identities`가 비어 있으면 중복 이메일로 간주합니다.
 *
 * @see https://supabase.com/docs/reference/javascript/auth-signup
 */
export function isSignUpDuplicateObfuscatedUser(user: User | null | undefined): boolean {
  if (!user) return false;
  const identities = user.identities;
  return Array.isArray(identities) && identities.length === 0;
}
