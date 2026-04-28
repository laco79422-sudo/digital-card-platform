import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

/**
 * 공개 브랜드 이미지 버킷 (기본값 `card-images`).
 * Supabase Dashboard → Storage 에서 동일 이름 버킷을 만들거나,
 * `supabase/migrations/*_card_images_storage.sql` 을 적용하세요.
 */
const DEFAULT_BUCKET = "card-images";

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

export function getCardImageBucket(): string {
  return import.meta.env.VITE_SUPABASE_CARD_IMAGE_BUCKET?.trim() || DEFAULT_BUCKET;
}

export async function uploadBrandImageDataUrl(dataUrl: string, originalFilename = "image.jpg"): Promise<string> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured");
  }

  const blob = dataUrlToBlob(dataUrl);
  const { data: userData } = await supabase.auth.getUser();
  const owner = safePathSegment(userData.user?.id ?? "guest");
  const bucket = getCardImageBucket();
  const ext = extensionForBlob(blob, originalFilename);
  const path = `${owner}/${Date.now()}-${safeFileStem(originalFilename)}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType: blob.type || "image/jpeg",
    cacheControl: "3600",
    upsert: true,
  });

  if (error) {
    console.error("이미지 업로드 실패:", error.message, error);
    throw error;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!data.publicUrl) throw new Error("Public URL was not returned");
  return data.publicUrl;
}
