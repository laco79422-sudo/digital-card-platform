import { DUPLICATE_EMAIL_MESSAGE, handleAuthError } from "@/lib/auth/authErrorMessage";
import { isSignUpDuplicateObfuscatedUser } from "@/lib/auth/signupEmailDuplicate";
import { getSupabaseConfigErrorMessage, isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export const GOOGLE_AUTH_PROVIDER = "google" as const;

export function getOAuthRedirectToDashboard(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/?login=success`;
}

export function getEmailAuthRedirectTo(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/auth/callback`;
}

export function isEmailConfirmed(user: Pick<User, "email_confirmed_at"> | null | undefined): boolean {
  return Boolean(user?.email_confirmed_at);
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
  userType: string;
  referralCode?: string | null;
};

export type SignUpWithEmailResult = {
  data: { user: User | null; session: Session | null } | null;
  errorMessage: string | null;
};

/** Supabase가 보내는 문자열로 중복 가입 여부를 1차 판별합니다. */
function looksLikeDuplicateEmailError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("already registered") ||
    m.includes("user already registered") ||
    m.includes("email address is already registered") ||
    m.includes("already been registered")
  );
}

export async function signUpWithEmail(params: SignUpWithEmailParams): Promise<SignUpWithEmailResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, errorMessage: getSupabaseConfigErrorMessage() };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          name: params.name,
          userType: params.userType,
          referredBy: params.referralCode ?? null,
        },
        emailRedirectTo: getEmailAuthRedirectTo(),
      },
    });

    if (error) {
      const raw = error.message ?? "";
      if (looksLikeDuplicateEmailError(raw)) {
        return { data: null, errorMessage: DUPLICATE_EMAIL_MESSAGE };
      }
      return { data: null, errorMessage: handleAuthError(error) };
    }

    // HTTP 200 + user는 오지만 identities가 비면 이메일 중복 난독화 응답으로 간주
    if (data?.user && isSignUpDuplicateObfuscatedUser(data.user)) {
      return { data: null, errorMessage: DUPLICATE_EMAIL_MESSAGE };
    }

    return { data: data ?? null, errorMessage: null };
  } catch {
    return {
      data: null,
      errorMessage: "회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }
}

export async function resendSignupConfirmationEmail(email: string): Promise<{ errorMessage: string | null }> {
  if (!isSupabaseConfigured || !supabase) {
    return { errorMessage: getSupabaseConfigErrorMessage() };
  }
  const clean = email.trim();
  if (!clean) return { errorMessage: "인증 메일을 받을 이메일을 입력해 주세요." };

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: clean,
    options: {
      emailRedirectTo: getEmailAuthRedirectTo(),
    },
  });
  if (error) return { errorMessage: handleAuthError(error) };
  return { errorMessage: null };
}

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
