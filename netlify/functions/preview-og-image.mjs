import { createClient } from "@supabase/supabase-js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requestOrigin(event) {
  const h = event.headers || {};
  const proto = (h["x-forwarded-proto"] || "https").split(",")[0].trim();
  const host = (h["x-forwarded-host"] || h.host || "mycardlab.netlify.app").split(",")[0].trim();
  return `${proto}://${host}`;
}

function firstGalleryHttps(raw) {
  if (!raw || typeof raw !== "string") return "";
  for (const line of raw.split("\n")) {
    const u = line.trim();
    if (u.startsWith("https://")) return u;
  }
  return "";
}

function resolveImageFromDraft(d, origin) {
  const base = origin.replace(/\/$/, "");
  let image = typeof d?.imageUrl === "string" ? d.imageUrl.trim() : "";
  if (!image) image = typeof d?.brand_image_url === "string" ? d.brand_image_url.trim() : "";
  if (!image.startsWith("https://")) image = firstGalleryHttps(d?.gallery_urls_raw);
  if (!image.startsWith("https://")) image = `${base}/og-default.png`;
  return image;
}

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const origin = requestOrigin(event);
  const fallback = `${origin}/og-default.png`;

  const tempId = typeof event.queryStringParameters?.tempId === "string" ? event.queryStringParameters.tempId.trim() : "";
  if (!tempId || !UUID_RE.test(tempId)) {
    return {
      statusCode: 302,
      headers: { Location: fallback, "Cache-Control": "public, max-age=300" },
      body: "",
    };
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    return {
      statusCode: 302,
      headers: { Location: fallback, "Cache-Control": "public, max-age=60" },
      body: "",
    };
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase.from("linko_temp_previews").select("payload").eq("id", tempId).maybeSingle();

  if (error || !data?.payload?.draft || typeof data.payload.draft !== "object") {
    return {
      statusCode: 302,
      headers: { Location: fallback, "Cache-Control": "public, max-age=120" },
      body: "",
    };
  }

  const image = resolveImageFromDraft(data.payload.draft, origin);
  return {
    statusCode: 302,
    headers: {
      Location: image,
      "Cache-Control": "public, max-age=300, s-maxage=600",
    },
    body: "",
  };
};
