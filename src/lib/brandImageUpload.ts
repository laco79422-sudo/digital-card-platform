import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

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

export async function uploadBrandImageDataUrl(dataUrl: string): Promise<string> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured");
  }

  const blob = dataUrlToBlob(dataUrl);
  const { data: userData } = await supabase.auth.getUser();
  const owner = safePathSegment(userData.user?.id ?? "guest");
  const bucket = import.meta.env.VITE_SUPABASE_CARD_IMAGE_BUCKET?.trim() || DEFAULT_BUCKET;
  const path = `${owner}/${crypto.randomUUID()}.jpg`;

  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType: "image/jpeg",
    cacheControl: "31536000",
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!data.publicUrl) throw new Error("Public URL was not returned");
  return data.publicUrl;
}

