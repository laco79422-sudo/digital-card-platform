import { createClient } from "@supabase/supabase-js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(), body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: corsHeaders(), body: "Method Not Allowed" };
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return { statusCode: 503, headers: corsHeaders(), body: "Server misconfigured" };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, headers: corsHeaders(), body: "Invalid JSON" };
  }

  const tempId = typeof body.tempId === "string" ? body.tempId.trim() : "";
  if (!tempId || !UUID_RE.test(tempId)) {
    return { statusCode: 400, headers: corsHeaders(), body: "Invalid tempId" };
  }

  const draft = body.draft;
  const linkRows = body.linkRows;
  if (!draft || typeof draft !== "object") {
    return { statusCode: 400, headers: corsHeaders(), body: "draft required" };
  }

  const payload = {
    draft,
    linkRows: Array.isArray(linkRows) ? linkRows : [],
  };

  const raw = JSON.stringify(payload);
  if (raw.length > 500_000) {
    return { statusCode: 413, headers: corsHeaders(), body: "Payload too large" };
  }

  const supabase = createClient(url, key);
  const { error } = await supabase.from("linko_temp_previews").upsert(
    {
      id: tempId,
      payload,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    console.error("[sync-temp-preview]", error);
    return { statusCode: 500, headers: corsHeaders(), body: "Upsert failed" };
  }

  return { statusCode: 204, headers: corsHeaders(), body: "" };
};
