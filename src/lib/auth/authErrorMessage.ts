const DUPLICATE_EMAIL_MESSAGE = "이미 등록된 이메일입니다. 로그인해 주세요.";
const LINKING_MESSAGE = "이미 이메일로 가입된 계정입니다. 로그인 후 연동해 주세요.";

/** Supabase Auth 오류를 로그하고 UI용 한글 문구로 반환합니다. */
export function handleAuthError(error: { message: string; code?: string; status?: number }): string {
  const code = error.code ?? "(no code)";
  console.warn("[auth]", code, error.status ?? "", error.message);
  return authErrorToKorean(error.message, error.code);
}

/**
 * `code` 우선(서버가 보내는 표준 코드), 없으면 `message` 문자열 매칭.
 */
export function authErrorToKorean(message: string, code?: string): string {
  const t = message.trim();
  const lower = t.toLowerCase();
  const c = code?.toLowerCase();

  if (c === "email_exists" || c === "user_already_exists") {
    return DUPLICATE_EMAIL_MESSAGE;
  }
  if (c === "identity_already_exists" || c === "email_conflict_identity_not_deletable") {
    return LINKING_MESSAGE;
  }

  if (
    lower.includes("user already registered") ||
    lower.includes("already been registered") ||
    lower.includes("email address is already registered") ||
    lower.includes("already registered") ||
    lower.includes("email already exists") ||
    lower.includes("user already exists") ||
    (lower.includes("duplicate") && lower.includes("email"))
  ) {
    return DUPLICATE_EMAIL_MESSAGE;
  }
  if (lower.includes("identity_already_exists") || lower.includes("identity already exists")) {
    return LINKING_MESSAGE;
  }

  if (lower.includes("invalid login credentials") || lower.includes("invalid credentials")) {
    return "이메일 또는 비밀번호가 맞지 않아요. 다시 확인해 주세요.";
  }
  if (lower.includes("email not confirmed")) {
    return "이메일 인증을 먼저 완료해 주세요.";
  }
  if (lower.includes("password should be at least")) {
    return "비밀번호는 안내한 글자 수 이상으로 설정해 주세요.";
  }
  if (lower.includes("signup is disabled")) {
    return "현재 새 가입이 잠시 닫혀 있어요. 관리자에게 문의해 주세요.";
  }
  if (lower.includes("email rate limit")) {
    return "잠시 후 다시 시도해 주세요. 요청이 너무 많아요.";
  }
  if (
    lower.includes("provider is not enabled") ||
    lower.includes("unsupported provider") ||
    lower.includes("provider not enabled")
  ) {
    return "Google 로그인이 Supabase에서 꺼져 있어요. 대시보드 → Authentication → Providers에서 Google을 켜고 Client ID·Secret을 저장해 주세요.";
  }

  return t;
}

export { DUPLICATE_EMAIL_MESSAGE, LINKING_MESSAGE };
