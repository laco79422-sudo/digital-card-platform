import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

/**
 * 공개 브랜드 이미지 버킷 (기본값 `card-images`).
 * Supabase Dashboard → Storage 에서 동일 이름 버킷을 만들거나,
 * `supabase/migrations/*_card_images_storage.sql` 을 적용하세요.
 */
const DEFAULT_BUCKET = "card-images";
const LOG_PREFIX = "[brandImageUpload]";

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, encoded] = dataUrl.split(",");
  if (!meta || !encoded) throw new Error("Invalid data URL");
  const mime = meta.match(/data:([^;]+)/)?.[1] || "image/jpeg";
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

function safePathSegment(value: string): string {
  return value.replace(/[^a-z0-9_-]/gi, "-").replace(/-+/g, "-").slice(0, 80) || "user";
}

function safeFileStem(value: string): string {
  const stem = value.replace(/\.[^.]+$/, "");
  return safePathSegment(stem).slice(0, 48) || "image";
}

function extensionForBlob(blob: Blob, originalFilename: string): string {
  const t = blob.type.toLowerCase();
  if (t.includes("png")) return "png";
  if (t.includes("webp")) return "webp";
  const lower = originalFilename.toLowerCase();
  if (lower.endsWith(".png")) return "png";
  if (lower.endsWith(".webp")) return "webp";
  return "jpg";
}

/** Storage/기타 에러를 문자열로 (순환 참조 방지) */
function errorToLogString(error: unknown): string {
  if (error == null) return String(error);
  if (typeof error === "string") return error;
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  try {
    return JSON.stringify(error, Object.getOwnPropertyNames(error as object));
  } catch {
    return String(error);
  }
}

export function getCardImageBucket(): string {
  return import.meta.env.VITE_SUPABASE_CARD_IMAGE_BUCKET?.trim() || DEFAULT_BUCKET;
}

async function fetchProfilesRoleForDebug(userId: string | undefined): Promise<{
  role: string | null;
  queryError: unknown | null;
}> {
  if (!userId || !supabase) {
    return { role: null, queryError: null };
  }
  const { data, error } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (error) {
    console.warn(`${LOG_PREFIX} profiles 테이블 role 조회 실패 (컬럼이 없을 수 있음)`, error);
    return { role: null, queryError: error };
  }
  const raw = data && typeof data === "object" && data !== null && "role" in data ? (data as { role: unknown }).role : null;
  const role = typeof raw === "string" && raw.trim() ? raw.trim() : raw != null ? String(raw) : null;
  return { role, queryError: null };
}

/** 업로드 실패 시 화면용 짧은 메시지 (실제 원인 구분) */
export function getBrandImageUploadUserMessage(error: unknown): string {
  const full = errorToLogString(error);
  const m = full.toLowerCase();

  if (/supabase is not configured|not configured/i.test(full)) {
    return "Supabase에 연결되지 않았습니다. 환경 설정을 확인해 주세요.";
  }

  if (/invalid data url/i.test(full)) {
    return "이미지 데이터 형식이 올바르지 않습니다.";
  }

  if (/not authenticated|jwt expired|invalid jwt|session|login required|must be logged/i.test(m)) {
    return "로그인 정보 없음";
  }

  if (/expert|전문가|requires.*expert|only.*expert/i.test(m)) {
    return "전문가 권한 없음";
  }

  if (/bucket not found|not found.*bucket|does not exist|no such bucket|404/.test(m) && /bucket|storage/i.test(m)) {
    return "저장소 bucket 없음";
  }

  if (/payload too large|413|entity too large|file too large|size limit/i.test(m)) {
    return "파일 용량 초과";
  }

  if (/mime|unsupported.*type|invalid.*format|not an allowed file/i.test(m)) {
    return "허용되지 않는 파일 형식";
  }

  if (/row-level security|rls|new row violates|policy|403 forbidden|access denied/i.test(m)) {
    return "Supabase Storage 정책 오류";
  }

  return "이미지 저장에 실패했습니다. 네트워크·권한을 확인하거나 잠시 후 다시 시도해 주세요.";
}

function logFullStorageError(error: unknown, label: string) {
  console.error(`${LOG_PREFIX} ${label} (전체):`, error);
  if (error && typeof error === "object") {
    console.error(`${LOG_PREFIX} ${label} JSON:`, errorToLogString(error));
  }
}

export async function uploadBrandImageDataUrl(dataUrl: string, originalFilename = "image.jpg"): Promise<string> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured");
  }

  const blob = dataUrlToBlob(dataUrl);
  const bucket = getCardImageBucket();
  const ext = extensionForBlob(blob, originalFilename);

  const { data: authData, error: getUserError } = await supabase.auth.getUser();

  console.info(`${LOG_PREFIX} supabase.auth.getUser() 결과:`, { data: authData, error: getUserError });
  const sessionUser = authData.user;
  console.info(`${LOG_PREFIX} user.id:`, sessionUser?.id ?? "(없음)");
  console.info(`${LOG_PREFIX} user.email:`, sessionUser?.email ?? "(없음)");

  const meta = sessionUser?.user_metadata as Record<string, unknown> | undefined;
  const appMeta = sessionUser?.app_metadata as Record<string, unknown> | undefined;
  console.info(`${LOG_PREFIX} user_metadata.role / userType:`, meta?.role ?? meta?.userType ?? "(없음)");
  console.info(`${LOG_PREFIX} app_metadata.role:`, appMeta?.role ?? "(없음)");

  const { role: profilesRole, queryError: profilesQueryError } = await fetchProfilesRoleForDebug(sessionUser?.id);
  console.info(
    `${LOG_PREFIX} profiles.role:`,
    profilesRole ?? "(없음 또는 미조회)",
    profilesQueryError ? `(조회 에러: ${errorToLogString(profilesQueryError)})` : "",
  );
  if (profilesRole) {
    console.info(`${LOG_PREFIX} role 구분 (profiles):`, profilesRole, "← user / expert / admin 등 스키마 기준");
  }

  console.info(`${LOG_PREFIX} Storage bucket 이름:`, bucket, `(환경변수 없으면 기본 ${DEFAULT_BUCKET})`);

  const owner = safePathSegment(sessionUser?.id ?? "guest");
  const path = `${owner}/${Date.now()}-${safeFileStem(originalFilename)}.${ext}`;

  const loggedIn = Boolean(sessionUser?.id);
  console.info(`${LOG_PREFIX} 업로드 직전 조건:`, {
    로그인여부: loggedIn,
    profilesRole값: profilesRole,
    파일타입_mime: blob.type || "image/jpeg",
    파일용량_bytes: blob.size,
    업로드경로: `${bucket}/${path}`,
    originalFilename,
  });

  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType: blob.type || "image/jpeg",
    cacheControl: "3600",
    upsert: true,
  });

  if (error) {
    logFullStorageError(error, "Supabase Storage upload error");
    throw error;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!data.publicUrl) throw new Error("Public URL was not returned");
  return data.publicUrl;
}
