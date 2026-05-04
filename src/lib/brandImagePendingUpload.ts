import { validateBrandImageFile } from "@/lib/brandImageConstraints";
import { brandImageDataUrlToBlob } from "@/lib/brandImageUpload";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

const DEFAULT_PENDING = "card-image-pending";

export function getPendingImageBucket(): string {
  return import.meta.env.VITE_SUPABASE_CARD_IMAGE_PENDING_BUCKET?.trim() || DEFAULT_PENDING;
}

function extensionForBlob(blob: Blob, originalFilename: string): string {
  const t = blob.type.toLowerCase();
  if (t.includes("png")) return "png";
  if (t.includes("webp")) return "webp";
  if (t.includes("jpeg") || t.includes("jpg")) return "jpg";
  const lower = originalFilename.toLowerCase();
  if (lower.endsWith(".png")) return "png";
  if (lower.endsWith(".webp")) return "webp";
  return "jpg";
}

/** data URL을 검수 대기(private) 버킷에 업로드하고 서명 URL을 반환합니다. */
export async function uploadBrandImageToPendingFromDataUrl(
  dataUrl: string,
  originalFilename: string,
  cardId: string,
): Promise<{ path: string; signedUrl: string }> {
  const blob = brandImageDataUrlToBlob(dataUrl);
  return uploadBrandImageToPendingFromBlob({ blob, originalFilename, cardId });
}

export async function uploadBrandImageToPendingFromBlob(params: {
  blob: Blob;
  originalFilename: string;
  cardId: string;
}): Promise<{ path: string; signedUrl: string }> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured");
  }

  const file = new File([params.blob], params.originalFilename, {
    type: params.blob.type || "image/jpeg",
  });
  const valid = validateBrandImageFile(file);
  if (!valid.ok) {
    throw new Error(valid.message);
  }

  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) {
    throw new Error("Not authenticated");
  }

  const { data: slotOk, error: slotErr } = await supabase.rpc("try_consume_brand_image_upload_slot");
  if (slotErr) {
    throw slotErr;
  }
  if (!slotOk) {
    throw new Error("daily_limit");
  }

  const ext = extensionForBlob(params.blob, params.originalFilename);
  const name = `${crypto.randomUUID()}.${ext}`;
  const path = `${uid}/${params.cardId.trim()}/${name}`;
  const bucket = getPendingImageBucket();

  const { error: upErr } = await supabase.storage.from(bucket).upload(path, params.blob, {
    contentType: params.blob.type || "image/jpeg",
    cacheControl: "3600",
    upsert: false,
  });
  if (upErr) {
    throw upErr;
  }

  const { data: sign, error: signErr } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  if (signErr || !sign?.signedUrl) {
    throw signErr ?? new Error("signed_url_failed");
  }

  return { path, signedUrl: sign.signedUrl };
}
