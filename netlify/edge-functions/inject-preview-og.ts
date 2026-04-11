import type { Context } from "https://edge.netlify.com";

type NetlifyEnvApi = { env: { get(key: string): string | undefined } };

/** Netlify-hosted Edge exposes dashboard env via Netlify.env; Deno.env alone is often empty in production. */
function readEnv(key: string): string | undefined {
  try {
    const N = (globalThis as unknown as { Netlify?: NetlifyEnvApi }).Netlify;
    const v = N?.env?.get(key);
    if (v != null && String(v).length > 0) return v;
  } catch {
    /* ignore */
  }
  return Deno.env.get(key);
}

type DraftLike = {
  person_name?: string;
  brand_name?: string;
  tagline?: string;
  intro?: string;
  brand_image_url?: string | null;
  gallery_urls_raw?: string;
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function firstGalleryHttps(raw: string | undefined): string {
  if (!raw?.trim()) return "";
  for (const line of raw.split("\n")) {
    const u = line.trim();
    if (u.startsWith("https://")) return u;
  }
  return "";
}

function ogFromDraft(d: DraftLike, fallbackImage: string): { title: string; desc: string; image: string; siteName: string } {
  const person = (d.person_name || "이름").trim();
  const brand = (d.brand_name || "Linko").trim();
  const title = `${person} | ${brand}`.slice(0, 80);
  const tag = d.tagline?.trim();
  const desc = (tag || d.intro || "").trim().slice(0, 300) || "명함 미리보기";
  let image = d.brand_image_url?.trim() || "";
  if (!image.startsWith("https://")) image = firstGalleryHttps(d.gallery_urls_raw);
  if (!image.startsWith("https://")) image = fallbackImage;
  return { title, desc, image, siteName: brand };
}

function buildSeoBlock(origin: string, tempId: string, d: DraftLike): string {
  const base = origin.replace(/\/$/, "");
  const canonical = `${base}/preview/${encodeURIComponent(tempId)}`;
  const fallbackImage = `${base}/og-image.png`;
  const { title, desc, image, siteName } = ogFromDraft(d, fallbackImage);
  const e = esc;
  return `<!--LINKO_SEO_START-->
    <title>${e(title)}</title>
    <meta name="description" content="${e(desc)}" />
    <link rel="canonical" href="${e(canonical)}" />
    <link rel="image_src" href="${e(image)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${e(canonical)}" />
    <meta property="og:site_name" content="${e(siteName)}" />
    <meta property="og:title" content="${e(title)}" />
    <meta property="og:description" content="${e(desc)}" />
    <meta property="og:image" content="${e(image)}" />
    <meta property="og:image:secure_url" content="${e(image)}" />
    <meta property="og:locale" content="ko_KR" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${e(title)}" />
    <meta name="twitter:description" content="${e(desc)}" />
    <meta name="twitter:image" content="${e(image)}" />
<!--LINKO_SEO_END-->`;
}

export default async (request: Request, context: Context) => {
  if (request.method !== "GET") {
    return context.next();
  }

  const url = new URL(request.url);
  const m = url.pathname.match(/^\/preview\/([^/]+)\/?$/);
  if (!m) {
    return context.next();
  }

  const tempId = decodeURIComponent(m[1]);
  const supabaseUrl = readEnv("SUPABASE_URL");
  const supabaseKey = readEnv("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseKey) {
    const res = await context.next();
    const headers = new Headers(res.headers);
    headers.set("X-Linko-Preview-Og", "skipped-no-env");
    headers.set(
      "X-Linko-Preview-Og-Hint",
      "Set SUPABASE_URL and SUPABASE_ANON_KEY in Netlify with scope including Edge Functions",
    );
    return new Response(await res.text(), { status: res.status, headers });
  }

  const rest = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/linko_temp_previews?id=eq.${encodeURIComponent(tempId)}&select=payload`;
  const r = await fetch(rest, {
    headers: {
      Accept: "application/json",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  });

  if (!r.ok) {
    const res = await context.next();
    const headers = new Headers(res.headers);
    headers.set("X-Linko-Preview-Og", `skipped-supabase-${r.status}`);
    return new Response(await res.text(), { status: res.status, headers });
  }

  const rows = (await r.json()) as { payload?: { draft?: DraftLike } }[];
  const draft = rows?.[0]?.payload?.draft;
  if (!draft || typeof draft !== "object") {
    const res = await context.next();
    const headers = new Headers(res.headers);
    headers.set("X-Linko-Preview-Og", "skipped-no-draft");
    return new Response(await res.text(), { status: res.status, headers });
  }

  const res = await context.next();
  const html = await res.text();
  const block = buildSeoBlock(url.origin, tempId, draft);
  const replaced = html.replace(/<!--LINKO_SEO_START-->[\s\S]*?<!--LINKO_SEO_END-->/, block);

  const headers = new Headers(res.headers);
  headers.set("content-type", "text/html; charset=utf-8");
  if (replaced === html) {
    headers.set("X-Linko-Preview-Og", "skipped-replace-failed");
    headers.set(
      "X-Linko-Preview-Og-Hint",
      "dist/index.html must contain <!--LINKO_SEO_START--> ... <!--LINKO_SEO_END-->",
    );
    return new Response(html, { status: res.status, headers });
  }

  headers.set("X-Linko-Preview-Og", "injected");
  headers.set("Cache-Control", "public, max-age=0, s-maxage=300");
  return new Response(replaced, { status: res.status, headers });
};

export const config = { path: "/preview/*" };
