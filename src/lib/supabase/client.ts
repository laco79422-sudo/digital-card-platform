import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function trimEnv(v: unknown): string {
  if (typeof v !== "string") return "";
  return v.trim();
}

const url = trimEnv(import.meta.env.VITE_SUPABASE_URL);
const anonKey = trimEnv(import.meta.env.VITE_SUPABASE_ANON_KEY);

/** .env 예시 문구가 그대로 들어간 경우만 차단 (일부 문자열이 JWT에 우연히 포함되는 오탐 방지) */
function looksLikeTemplateValue(s: string): boolean {
  const lower = s.toLowerCase();
  const templates = [
    "your-project-url",
    "your-anon-key",
    "your-project-ref.supabase.co",
    "your_supabase_url",
    "your_supabase_anon_key",
  ];
  return templates.some((t) => lower.includes(t));
}

function isLikelySupabaseUrl(u: string): boolean {
  if (!u || looksLikeTemplateValue(u)) return false;
  try {
    const parsed = new URL(u);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/** Supabase anon(public) 키는 JWT로 `eyJ`로 시작하는 경우가 대부분입니다. */
function isLikelyAnonKey(k: string): boolean {
  if (!k || looksLikeTemplateValue(k)) return false;
  return k.startsWith("eyJ") && k.length >= 80;
}

export const isSupabaseConfigured = isLikelySupabaseUrl(url) && isLikelyAnonKey(anonKey);

function logSupabaseConfigError(): void {
  const lines: string[] = [
    "[Linko / Supabase] 클라이언트를 만들 수 없습니다. 프로젝트 루트의 `.env`를 확인한 뒤 개발 서버를 다시 시작하세요.",
  ];
  if (!trimEnv(import.meta.env.VITE_SUPABASE_URL)) {
    lines.push("  · VITE_SUPABASE_URL: 없음 또는 비어 있음");
  } else if (!isLikelySupabaseUrl(url)) {
    lines.push("  · VITE_SUPABASE_URL: https URL 형식이 아니거나 예시 문구가 포함되어 있음");
  }
  if (!trimEnv(import.meta.env.VITE_SUPABASE_ANON_KEY)) {
    lines.push("  · VITE_SUPABASE_ANON_KEY: 없음 또는 비어 있음");
  } else if (!isLikelyAnonKey(anonKey)) {
    lines.push(
      "  · VITE_SUPABASE_ANON_KEY: anon public 키 전체가 아니거나 형식이 맞지 않음 (보통 eyJ로 시작)",
    );
  }
  console.error(lines.join("\n"));
}

if (!isSupabaseConfigured) {
  logSupabaseConfigError();
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

/** `isSupabaseConfigured === false`일 때 로그인/회원가입 폼에 표시 */
export function getSupabaseConfigErrorMessage(): string {
  if (isSupabaseConfigured) return "";
  if (!url) {
    return "VITE_SUPABASE_URL이 비어 있습니다. 프로젝트 루트 `.env`에 넣은 뒤 개발 서버를 다시 시작하세요.";
  }
  if (!anonKey) {
    return "VITE_SUPABASE_ANON_KEY가 비어 있습니다. Supabase → Project Settings → API에서 anon public 키를 복사해 넣으세요.";
  }
  if (!isLikelySupabaseUrl(url)) {
    return "VITE_SUPABASE_URL이 올바른 https 주소가 아닙니다.";
  }
  if (!isLikelyAnonKey(anonKey)) {
    return "VITE_SUPABASE_ANON_KEY가 유효하지 않습니다. Settings → API의 anon public 키 전체를 붙여넣었는지 확인하세요.";
  }
  return "Supabase 환경 변수를 확인한 뒤 개발 서버를 다시 시작하세요.";
}
