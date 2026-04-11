import type { Context } from "https://edge.netlify.com";

type DraftLike = {
  person_name?: string;
  brand_name?: string;
  tagline?: string;
  intro?: string;
  brand_image_url?: string | null;
  gallery_urls_raw?: string;
};

const DEFAULT_OG_IMAGE = "https://mycardlab.netlify.app/og-image.png";

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
  const canonical = `${origin.replace(/\/$/, "")}/preview/${encodeURIComponent(tempId)}`;
  const { title, desc, image, siteName } = ogFromDraft(d, DEFAULT_OG_IMAGE);
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
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseKey) {
    return context.next();
  }

  const rest = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/linko_temp_previews?id=eq.${encodeURIComponent(tempId)}&select=payload`;
  const r = await fetch(rest, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  });

  if (!r.ok) {
    return context.next();
  }

  const rows = (await r.json()) as { payload?: { draft?: DraftLike } }[];
  const draft = rows?.[0]?.payload?.draft;
  if (!draft || typeof draft !== "object") {
    return context.next();
  }

  const res = await context.next();
  const html = await res.text();
  const block = buildSeoBlock(url.origin, tempId, draft);
  const replaced = html.replace(/<!--LINKO_SEO_START-->[\s\S]*?<!--LINKO_SEO_END-->/, block);

  const headers = new Headers(res.headers);
  headers.set("content-type", "text/html; charset=utf-8");
  return new Response(replaced, { status: res.status, headers });
};

export const config = { path: "/preview/*" };
