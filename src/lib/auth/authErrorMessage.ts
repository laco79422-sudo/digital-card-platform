/** Map common Supabase Auth API messages to friendly Korean. */
export function authErrorToKorean(message: string): string {
  const t = message.trim();
  const lower = t.toLowerCase();

  if (lower.includes("invalid login credentials") || lower.includes("invalid credentials")) {
    return "이메일 또는 비밀번호가 맞지 않아요. 다시 확인해 주세요.";
  }
  if (lower.includes("email not confirmed")) {
    return "이메일 인증을 먼저 완료해 주세요.";
  }
  if (lower.includes("user already registered") || lower.includes("already been registered")) {
    return "이미 가입된 이메일이에요. 로그인해 보세요.";
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

  return t;
}
