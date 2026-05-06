import { normalizeBusinessCardRow } from "@/lib/businessCardRow";
import { getPendingImageBucket } from "@/lib/brandImagePendingUpload";
import { getCardImageBucket } from "@/lib/brandImageUpload";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import type { BusinessCard } from "@/types/domain";

const TABLE = "business_cards";

export async function fetchPendingBrandImageCards(): Promise<BusinessCard[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .in("brand_image_status", ["pending_review", "pending"])
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("[brandImageModerationService] fetchPendingBrandImageCards", error.message);
    return [];
  }
  return [...((data as Record<string, unknown>[]) ?? [])].map((row) => normalizeBusinessCardRow(row));
}

export async function createSignedUrlForPendingPath(path: string, expiresSec = 3600): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase || !path.trim()) return null;
  const bucket = getPendingImageBucket();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path.trim(), expiresSec);
  if (error || !data?.signedUrl) {
    console.warn("[brandImageModerationService] createSignedUrlForPendingPath", error?.message);
    return null;
  }
  return data.signedUrl;
}

export async function approveBrandImageModeration(
  card: BusinessCard,
): Promise<{ ok: boolean; publicUrl?: string; error?: string }> {
  if (!isSupabaseConfigured || !supabase) return { ok: false, error: "not_configured" };
  const pendingPath = card.brand_image_pending_path?.trim();
  if (!pendingPath || !card.user_id?.trim() || !card.id?.trim()) {
    return { ok: false, error: "invalid_card" };
  }

  const bucketP = getPendingImageBucket();
  const bucketPub = getCardImageBucket();

  const { data: blob, error: dlErr } = await supabase.storage.from(bucketP).download(pendingPath);
  if (dlErr || !blob) {
    return { ok: false, error: dlErr?.message ?? "download_failed" };
  }

  const ext = pendingPath.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? (ext === "jpeg" ? "jpg" : ext) : "jpg";
  const publicPath = `${card.user_id.trim()}/${card.id.trim()}/${crypto.randomUUID()}.${safeExt}`;
  const mime = blob.type || "image/jpeg";

  const { error: upErr } = await supabase.storage.from(bucketPub).upload(publicPath, blob, {
    contentType: mime,
    upsert: false,
  });
  if (upErr) {
    return { ok: false, error: upErr.message };
  }

  const { data: pub } = supabase.storage.from(bucketPub).getPublicUrl(publicPath);
  const publicUrl = pub.publicUrl;
  if (!publicUrl) {
    return { ok: false, error: "public_url" };
  }

  const { error: rmErr } = await supabase.storage.from(bucketP).remove([pendingPath]);
  if (rmErr) {
    console.warn("[brandImageModerationService] remove pending after approve", rmErr.message);
  }

  const { error: dbErr } = await supabase
    .from(TABLE)
    .update({
      brand_image_status: "approved",
      brand_image_pending_path: null,
      brand_image_reject_reason: null,
      brand_image_pending_uploaded_at: null,
      image_url: publicUrl,
      imageUrl: publicUrl,
      brand_image_url: publicUrl,
    })
    .eq("id", card.id);
  if (dbErr) {
    return { ok: false, error: dbErr.message };
  }
  return { ok: true, publicUrl };
}

export async function rejectBrandImageModeration(
  card: BusinessCard,
  reason: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) return { ok: false, error: "not_configured" };
  const pendingPath = card.brand_image_pending_path?.trim();
  if (pendingPath) {
    const bucketP = getPendingImageBucket();
    await supabase.storage.from(bucketP).remove([pendingPath]);
  }
  const { error } = await supabase
    .from(TABLE)
    .update({
      brand_image_status: "rejected_manual",
      brand_image_reject_reason: reason.trim() || null,
      brand_image_pending_path: null,
      brand_image_pending_uploaded_at: null,
    })
    .eq("id", card.id);
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/** 검수 대기 이미지와 DB 필드를 삭제합니다(공개 이미지는 유지하지 않음). */
export async function deletePendingBrandImageModeration(card: BusinessCard): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) return { ok: false, error: "not_configured" };
  const pendingPath = card.brand_image_pending_path?.trim();
  if (pendingPath) {
    const bucketP = getPendingImageBucket();
    await supabase.storage.from(bucketP).remove([pendingPath]);
  }
  const { error } = await supabase
    .from(TABLE)
    .update({
      brand_image_pending_path: null,
      brand_image_pending_uploaded_at: null,
      brand_image_status: "rejected_manual",
      brand_image_reject_reason: "관리자에 의해 삭제되었습니다.",
    })
    .eq("id", card.id);
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
