import { DUPLICATE_EMAIL_MESSAGE, handleAuthError } from "@/lib/auth/authErrorMessage";
import { isSignUpDuplicateObfuscatedUser } from "@/lib/auth/signupEmailDuplicate";
import { getSupabaseConfigErrorMessage, isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export const GOOGLE_AUTH_PROVIDER = "google" as const;

export function getOAuthRedirectToDashboard(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/dashboard`;
}

export type SignInWithEmailResult = {
  user: User | null;
  session: Session | null;
  errorMessage: string | null;
};

export async function signInWithEmail(email: string, password: string): Promise<SignInWithEmailResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { user: null, session: null, errorMessage: getSupabaseConfigErrorMessage() };
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { user: null, session: null, errorMessage: handleAuthError(error) };
  }
  return {
    user: data.user ?? null,
    session: data.session ?? null,
    errorMessage: null,
  };
}

export type SignUpWithEmailParams = {
  email: string;
  password: string;
  name: string;
  /** 사업자(client) / 제작자(creator) 등 — user_metadata.userType 으로 저장 */
  userType: string;
};

export type SignUpWithEmailResult = {
  data: { user: User | null; session: Session | null } | null;
  errorMessage: string | null;
};

export async function signUpWithEmail(params: SignUpWithEmailParams): Promise<SignUpWithEmailResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, errorMessage: getSupabaseConfigErrorMessage() };
  }
  // Supabase Auth: user_metadata 에 이름·유형만 넣음 (별도 SQL 함수 불필요)
  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        name: params.name,
        userType: params.userType,
      },
      emailRedirectTo: `${window.location.origin}/dashboard`,
    },
  });
  if (error) {
    return { data: null, errorMessage: handleAuthError(error) };
  }
  if (data.user && isSignUpDuplicateObfuscatedUser(data.user)) {
    console.warn("[auth] signUp: duplicate email (obfuscated response, empty identities)", {
      id: data.user.id,
    });
    return { data: null, errorMessage: DUPLICATE_EMAIL_MESSAGE };
  }
  return { data, errorMessage: null };
}

/** Google OAuth 시작(전체 페이지 이동). 성공 시 브라우저가 Google/Supabase로 이동합니다. */
export async function signInWithGoogle(): Promise<{ errorMessage: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { errorMessage: getSupabaseConfigErrorMessage() };
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: GOOGLE_AUTH_PROVIDER,
    options: {
      redirectTo: getOAuthRedirectToDashboard(),
    },
  });
  if (error) {
    return { errorMessage: handleAuthError(error) };
  }
  return { errorMessage: null };
}
