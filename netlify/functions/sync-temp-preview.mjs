import { createClient } from "@supabase/supabase-js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
  };
}

function json(statusCode, payload) {
  return {
    statusCode,
    headers: corsHeaders(),
    body: JSON.stringify(payload),
  };
}

export const handler = async (event) => {
  const isDev = process.env.NODE_ENV !== "production";
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  console.log("[sync-temp-preview] start", {
    requestId,
    method: event.httpMethod,
    path: event.path,
  });

  if (event.httpMethod === "OPTIONS") {
    console.log("[sync-temp-preview] return 204 (OPTIONS)", { requestId });
    return { statusCode: 204, headers: corsHeaders(), body: "" };
  }

  if (event.httpMethod !== "POST") {
    console.error("[sync-temp-preview] invalid method", { requestId, method: event.httpMethod });
    return json(405, { ok: false, stage: "method-check", error: "Method Not Allowed", requestId });
  }

  const rawBody = event.body || "";
  console.log("[sync-temp-preview] raw body:", {
    requestId,
    bytes: rawBody.length,
    preview: rawBody.slice(0, 1200),
  });

  let body = null;
  try {
    body = JSON.parse(rawBody || "{}");
    console.log("[sync-temp-preview] payload parsed", {
      requestId,
      keys: Object.keys(body || {}),
    });
    console.log("[sync-temp-preview] parsed payload:", {
      requestId,
      payload: body,
    });
  } catch (error) {
    console.error("[sync-temp-preview] invalid json", {
      requestId,
      error: String(error),
    });
    return json(400, { ok: false, stage: "parse-body", error: "Invalid JSON", requestId });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log("[sync-temp-preview] env check:", {
    requestId,
    hasSupabaseUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    hasServiceRoleKey: !!supabaseServiceRoleKey,
    isDev,
  });
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("[sync-temp-preview] env missing", { requestId });
    return json(503, {
      ok: false,
      stage: "env-check",
      error: "Server misconfigured",
      details: isDev
        ? {
            hasSupabaseUrl: !!supabaseUrl,
            hasAnonKey: !!supabaseAnonKey,
            hasServiceRoleKey: !!supabaseServiceRoleKey,
          }
        : undefined,
      requestId,
    });
  }
  console.log("[sync-temp-preview] env ok", { requestId });

  const tempId = typeof body.tempId === "string" ? body.tempId.trim() : "";
  const previewId = typeof body.previewId === "string" ? body.previewId.trim() : tempId;
  console.log("[sync-temp-preview] tempId:", { requestId, tempId });
  console.log("[sync-temp-preview] previewId:", { requestId, previewId });
  if (!tempId || !UUID_RE.test(tempId)) {
    console.error("[sync-temp-preview] invalid tempId", { requestId, tempId });
    return json(400, { ok: false, stage: "validate-tempId", error: "Invalid tempId", tempId, requestId });
  }

  const draft = body.draft;
  const linkRows = body.linkRows;
  if (!draft || typeof draft !== "object") {
    console.error("[sync-temp-preview] draft required", { requestId, draftType: typeof draft });
    return json(400, { ok: false, stage: "validate-draft", error: "draft required", requestId });
  }

  const payload = {
    draft,
    linkRows: Array.isArray(linkRows) ? linkRows : [],
  };

  const raw = JSON.stringify(payload);
  if (raw.length > 500_000) {
    console.error("[sync-temp-preview] payload too large", { requestId, bytes: raw.length });
    return json(413, { ok: false, stage: "validate-size", error: "Payload too large", bytes: raw.length, requestId });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    console.log("[sync-temp-preview] before supabase insert", {
      requestId,
      table: "linko_temp_previews",
      tempId,
      previewId,
      linkRowsCount: payload.linkRows.length,
    });
    const result = await supabase.from("linko_temp_previews").upsert(
      {
        id: tempId,
        payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    console.log("[sync-temp-preview] after supabase insert:", {
      requestId,
      hasError: !!result.error,
      errorMessage: result.error?.message ?? null,
      errorCode: result.error?.code ?? null,
      errorDetails: result.error?.details ?? null,
    });

    if (result.error) {
      console.error("[sync-temp-preview] upsert failed", { requestId, error: result.error });
      return json(500, {
        ok: false,
        stage: "supabase-upsert",
        error: result.error.message || "Upsert failed",
        code: result.error.code ?? null,
        details: result.error.details ?? null,
        hint: result.error.hint ?? null,
        requestId,
      });
    }

    console.log("[sync-temp-preview] insert ok", { requestId, tempId });
    console.log("[sync-temp-preview] return 200", { requestId });
    return json(200, { ok: true, stage: "done", tempId, previewId, requestId });
  } catch (error) {
    console.error("[sync-temp-preview] fatal error:", {
      requestId,
      error: String(error),
      stack: error instanceof Error ? error.stack : null,
    });
    return json(500, {
      ok: false,
      stage: "catch",
      error: String(error),
      requestId,
    });
  }
};
