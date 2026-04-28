import { getCardImageBucket } from "@/lib/brandImageUpload";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

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
  const { data: userData } = await supabase.auth.getUser();
  const owner = safeSeg(userData.user?.id ?? "guest");
  const bucket = getCardImageBucket();
  const path = `${owner}/qr-${safeSeg(cardId)}.png`;

  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType: "image/png",
    cacheControl: "86400",
    upsert: true,
  });

  if (error) {
    console.error("[qrImageUpload] 업로드 실패:", error.message, error);
    throw error;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!data.publicUrl) throw new Error("Public URL was not returned");
  return data.publicUrl;
}
