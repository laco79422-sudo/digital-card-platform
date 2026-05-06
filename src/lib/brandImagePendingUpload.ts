import { validateBrandImageFile } from "@/lib/brandImageConstraints";
import { formatUploadErrorForDisplay } from "@/lib/brandImageUploadDiagnostics";
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
  console.log("SUPABASE URL:", import.meta.env.VITE_SUPABASE_URL);

  if (!isSupabaseConfigured || !supabase) {
    throw new Error(formatUploadErrorForDisplay(new Error("Supabase is not configured")));
  }

  const file = new File([params.blob], params.originalFilename, {
    type: params.blob.type || "image/jpeg",
  });
  const valid = validateBrandImageFile(file);
  if (!valid.ok) {
    throw new Error(valid.message);
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  console.log("USER:", userData?.user);
  console.log("USER ERROR:", userError);
  const uid = userData?.user?.id;
  if (!uid) {
    const err = new Error(
      userError?.message?.trim() || "Not authenticated (no session / uid)",
    );
    console.error("UPLOAD ERROR:", err, userError);
    throw new Error(formatUploadErrorForDisplay(err));
  }

  const ext = extensionForBlob(params.blob, params.originalFilename);
  const name = `${crypto.randomUUID()}.${ext}`;
  const path = `${uid}/${params.cardId.trim()}/${name}`;
  console.log("UPLOAD BUCKET:", "card-image-pending");
  const bucket = getPendingImageBucket();
  console.log("UPLOAD BUCKET (effective):", bucket);
  console.log("UPLOAD PATH:", path);

  const { error: upErr } = await supabase.storage.from(bucket).upload(path, params.blob, {
    contentType: params.blob.type || "image/jpeg",
    cacheControl: "3600",
    upsert: false,
  });
  if (upErr) {
    console.error("UPLOAD ERROR:", upErr);
    throw new Error(formatUploadErrorForDisplay(upErr));
  }

  const { data: sign, error: signErr } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  if (signErr || !sign?.signedUrl) {
    const wrapped = signErr ?? new Error("createSignedUrl returned no URL");
    console.error("UPLOAD ERROR:", wrapped);
    throw new Error(formatUploadErrorForDisplay(wrapped));
  }

  return { path, signedUrl: sign.signedUrl };
}
