import { getCardImageBucket } from "@/lib/brandImageUpload";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

const LOG_PREFIX = "[qrImageUpload]";

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, encoded] = dataUrl.split(",");
  if (!meta || !encoded) throw new Error("Invalid data URL");
  const mime = meta.match(/data:([^;]+)/)?.[1] || "image/png";
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

function safeSeg(value: string): string {
  return value.replace(/[^a-z0-9_-]/gi, "-").replace(/-+/g, "-").slice(0, 80) || "card";
}

/** 명함 QR PNG를 스토리지에 올리고 공개 URL 반환 */
export async function uploadQrImageDataUrl(cardId: string, pngDataUrl: string): Promise<string> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured");
  }

  const blob = dataUrlToBlob(pngDataUrl);
  const { data: authData, error: getUserError } = await supabase.auth.getUser();
  console.info(`${LOG_PREFIX} supabase.auth.getUser():`, { data: authData, error: getUserError });
  console.info(`${LOG_PREFIX} user.id:`, authData.user?.id ?? "(없음)");
  console.info(`${LOG_PREFIX} user.email:`, authData.user?.email ?? "(없음)");

  const owner = safeSeg(authData.user?.id ?? "guest");
  const bucket = getCardImageBucket();
  const path = `${owner}/qr-${safeSeg(cardId)}.png`;

  console.info(`${LOG_PREFIX} bucket / path:`, bucket, path);
  console.info(`${LOG_PREFIX} 업로드 직전:`, {
    로그인여부: Boolean(authData.user?.id),
    blobSize_bytes: blob.size,
    mime: blob.type,
  });

  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType: "image/png",
    cacheControl: "86400",
    upsert: true,
  });

  if (error) {
    console.error(`${LOG_PREFIX} Supabase Storage upload error (전체):`, error);
    try {
      console.error(`${LOG_PREFIX} error JSON:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
    } catch {
      /* ignore */
    }
    throw error;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!data.publicUrl) throw new Error("Public URL was not returned");
  return data.publicUrl;
}
