import type { User, UserRole } from "@/types/domain";

function normalizeRole(v: unknown): UserRole {
  if (v === "creator" || v === "admin" || v === "company_admin") return v;
  return "client";
}

function stringFromMeta(meta: Record<string, unknown>, key: string): string | null {
  const v = meta[key];
  if (typeof v === "string" && v.trim()) return v.trim();
  return null;
}

/** Supabase Auth `user_metadata` / OAuth(Google 등)에서 흔한 표시 이름 필드 */
export function resolveDisplayName(
  meta: Record<string, unknown>,
  email: string | null | undefined,
): string {
  const directKeys = ["name", "full_name", "display_name", "preferred_username"] as const;
  for (const k of directKeys) {
    const s = stringFromMeta(meta, k);
    if (s) return s;
  }
  const given = stringFromMeta(meta, "given_name");
  const family = stringFromMeta(meta, "family_name");
  if (given && family) return `${given} ${family}`.trim();
  if (given) return given;
  if (family) return family;
  const local = typeof email === "string" ? email.split("@")[0]?.trim() : undefined;
  if (local) return local;
  return "사용자";
}

/**
 * Supabase Auth 사용자 → 앱 `User`.
 * 이름은 `user_metadata`(회원가입 시 `options.data`) → 이메일 로컬파트 → "사용자" 순.
 * 별도 `profiles` 테이블은 스키마가 프로젝트마다 달라, 필요 시 여기서 `getUser()` 후 RPC/조회를 붙이면 됩니다.
 */
export function mapSupabaseUser(sessionUser: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): User {
  const meta = sessionUser.user_metadata ?? {};
  return {
    id: sessionUser.id,
    role: normalizeRole(meta.role),
    name: resolveDisplayName(meta, sessionUser.email),
    email: sessionUser.email ?? "",
    phone: typeof meta.phone === "string" ? meta.phone : null,
    avatar_url:
      typeof meta.avatar_url === "string"
        ? meta.avatar_url
        : typeof meta.picture === "string"
          ? meta.picture
          : null,
    created_at: new Date().toISOString(),
  };
}
