/**
 * Supabase/PostgREST 에러 객체를 콘솔에 빠짐없이 남깁니다.
 * (message 외 code, details, hint 및 enumerable 필드)
 */
export function logSupabaseError(context: string, error: unknown, extra?: Record<string, unknown>): void {
  console.error(`[Supabase] ${context}`, error);
  if (extra && Object.keys(extra).length > 0) {
    console.error(`[Supabase] ${context} · context`, extra);
  }
  if (error && typeof error === "object") {
    const o = error as Record<string, unknown>;
    console.error(`[Supabase] ${context} · fields`, {
      name: o.name,
      message: o.message,
      code: o.code,
      details: o.details,
      hint: o.hint,
    });
    try {
      console.error(`[Supabase] ${context} · json`, JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    } catch {
      console.error(`[Supabase] ${context} · stringify failed`);
    }
  }
}
