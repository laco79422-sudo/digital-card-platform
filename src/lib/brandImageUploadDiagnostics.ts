/**
 * Storage·Auth 업로드 실패 시 화면용 문구 — 분류 태그 + 원문 메시지(숨기지 않음)
 */
export function extractErrorMessage(error: unknown): string {
  if (error == null) return "알 수 없는 오류(null/undefined)";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message || error.name || String(error);
  if (typeof error === "object") {
    const o = error as Record<string, unknown>;
    if (typeof o.message === "string" && o.message.trim()) return o.message.trim();
    try {
      return JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
    } catch {
      return String(error);
    }
  }
  return String(error);
}

/**
 * 사용자 요청: Bucket / RLS / JWT 등 분류 + `error.message` 원문 그대로 노출
 */
export function formatUploadErrorForDisplay(error: unknown): string {
  const raw = extractErrorMessage(error);
  const lower = raw.toLowerCase();
  const tags: string[] = [];
  if (
    /bucket not found|no such bucket|not found.*bucket|does not exist.*bucket|storage.*404/i.test(lower) ||
    (/404/.test(raw) && /bucket|storage/i.test(lower))
  ) {
    tags.push("Bucket not found");
  }
  if (/permission denied|403|forbidden/i.test(lower) && !tags.includes("RLS policy violation")) {
    if (/policy|rls|row-level|violates|bucket.*policy/i.test(lower)) {
      tags.push("RLS policy violation");
    } else {
      tags.push("Permission denied");
    }
  }
  if (/row-level security|new row violates|policy.*violation|\brls\b/i.test(lower)) {
    if (!tags.includes("RLS policy violation")) tags.push("RLS policy violation");
  }
  if (/jwt|invalid.*token|session.*missing|not authenticated|auth.*session|invalid login credentials/i.test(lower)) {
    tags.push("Invalid JWT / session");
  }
  if (/daily_limit|일일|하루.*5/i.test(lower)) tags.push("Daily upload limit (5)");
  const prefix = tags.length > 0 ? `[${tags.join(" · ")}] ` : "";
  return `${prefix}${raw}`;
}
