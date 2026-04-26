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
  card_type?: "person" | "store" | "location" | "result" | "event" | "trust";
  person_name?: string;
  brand_name?: string;
  tagline?: string;
  intro?: string;
  address?: string;
  trust_metric?: string;
  brand_image_url?: string | null;
  gallery_urls_raw?: string;
};

type CardLike = {
  slug?: string;
  person_name?: string;
  brand_name?: string;
  job_title?: string;
  tagline?: string | null;
  intro?: string;
  brand_image_url?: string | null;
  gallery_urls?: string[] | null;
};

const COMPANY_OG_TITLE = "린코 디지털 명함";
const COMPANY_OG_DESCRIPTION = "명함 하나로 고객이 먼저 찾아옵니다";
const COMPANY_OG_IMAGE_PATH = "/og-default.png";

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

function firstGalleryHttpsFromList(urls: string[] | null | undefined): string {
  for (const u of urls ?? []) {
    const clean = u.trim();
    if (clean.startsWith("https://")) return clean;
  }
  return "";
}

function absoluteImage(base: string, pathOrUrl: string): string {
  if (pathOrUrl.startsWith("https://")) return pathOrUrl;
  return `${base}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
}

function ogFromDraft(
  d: DraftLike,
  fallbackImage: string,
  queryType?: string | null,
): { title: string; desc: string; image: string; siteName: string } {
  const type = queryType || d.card_type || "person";
  const person = (d.person_name || "").trim().slice(0, 80) || "이름";
  const brand = (d.brand_name || "Linko").trim().slice(0, 80);
  const headline = ((d.tagline || d.intro || "").trim() || "명함 미리보기").slice(0, 300);
  const address = (d.address || "").trim().slice(0, 300);
  const trust = (d.trust_metric || "").trim().slice(0, 300);
  const title =
    type === "store"
      ? brand || person
      : type === "location"
        ? brand || person
        : type === "result"
          ? headline.slice(0, 80)
          : type === "event"
            ? `${brand || person} 이벤트`.slice(0, 80)
            : person;
  const desc =
    type === "location"
      ? (address || headline || brand).slice(0, 300)
      : type === "trust"
        ? `${brand} · ${trust || headline}`.slice(0, 300)
        : `${brand} · ${headline}`.slice(0, 300);
  let image = d.brand_image_url?.trim() || "";
  if (!image.startsWith("https://")) image = firstGalleryHttps(d.gallery_urls_raw);
  if (!image.startsWith("https://")) image = fallbackImage;
  return { title, desc, image, siteName: brand };
}

function buildSeoBlock(origin: string, tempId: string, d: DraftLike, queryType?: string | null): string {
  const base = origin.replace(/\/$/, "");
  const t = (queryType || d.card_type || "").trim();
  const canonicalBase = `${base}/preview/${encodeURIComponent(tempId)}`;
  const canonical = t ? `${canonicalBase}?type=${encodeURIComponent(t)}` : canonicalBase;
  const fallbackImage = `${base}${COMPANY_OG_IMAGE_PATH}`;
  const { title, desc, siteName } = ogFromDraft(d, fallbackImage, t);
  /** 카카오·크롤러가 동일 URL로 썸네일을 조회하도록 preview 전용 엔드포인트(302 → 실제 이미지) */
  const image = `${base}/.netlify/functions/preview-og-image?tempId=${encodeURIComponent(tempId)}`;
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

function buildCommonSeoBlock(params: {
  canonical: string;
  title: string;
  desc: string;
  image: string;
  siteName?: string;
  type?: string;
}): string {
  const e = esc;
  const siteName = params.siteName || COMPANY_OG_TITLE;
  const type = params.type || "website";
  return `<!--LINKO_SEO_START-->
    <title>${e(params.title)}</title>
    <meta name="description" content="${e(params.desc)}" />
    <link rel="canonical" href="${e(params.canonical)}" />
    <link rel="image_src" href="${e(params.image)}" />
    <meta property="og:type" content="${e(type)}" />
    <meta property="og:url" content="${e(params.canonical)}" />
    <meta property="og:site_name" content="${e(siteName)}" />
    <meta property="og:title" content="${e(params.title)}" />
    <meta property="og:description" content="${e(params.desc)}" />
    <meta property="og:image" content="${e(params.image)}" />
    <meta property="og:image:secure_url" content="${e(params.image)}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${e(params.title)}" />
    <meta property="og:locale" content="ko_KR" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${e(params.title)}" />
    <meta name="twitter:description" content="${e(params.desc)}" />
    <meta name="twitter:image" content="${e(params.image)}" />
<!--LINKO_SEO_END-->`;
}

function buildCompanySeoBlock(origin: string): string {
  const base = origin.replace(/\/$/, "");
  return buildCommonSeoBlock({
    canonical: `${base}/`,
    title: COMPANY_OG_TITLE,
    desc: COMPANY_OG_DESCRIPTION,
    image: absoluteImage(base, COMPANY_OG_IMAGE_PATH),
  });
}

function ogFromCard(card: CardLike, fallbackImage: string): { title: string; desc: string; image: string; siteName: string } {
  const name = (card.person_name || card.brand_name || "디지털 명함").trim().slice(0, 80);
  const titleText = (card.job_title || "디지털 명함").trim().slice(0, 80);
  const title = `${name} | ${titleText}`.slice(0, 160);
  const desc = ((card.tagline || card.intro || "명함 하나로 고객이 먼저 찾아옵니다").trim()).slice(0, 300);
  let image = card.brand_image_url?.trim() || "";
  if (!image.startsWith("https://")) image = firstGalleryHttpsFromList(card.gallery_urls);
  if (!image.startsWith("https://")) image = fallbackImage;
  return { title, desc, image, siteName: (card.brand_name || COMPANY_OG_TITLE).trim() };
}

async function fetchPublicCardBySlug(
  supabaseUrl: string,
  supabaseKey: string,
  slug: string,
): Promise<{ card: CardLike | null; status: number }> {
  const rest = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/business_cards?slug=eq.${encodeURIComponent(slug)}&is_public=eq.true&select=slug,person_name,brand_name,job_title,tagline,intro,brand_image_url,gallery_urls&limit=1`;
  const r = await fetch(rest, {
    headers: {
      Accept: "application/json",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  });
  if (!r.ok) return { card: null, status: r.status };
  const rows = (await r.json()) as CardLike[];
  return { card: rows?.[0] ?? null, status: r.status };
}

async function injectSeo(
  context: Context,
  block: string,
  headerValue: string,
): Promise<Response> {
  const res = await context.next();
  const html = await res.text();
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
  headers.set("X-Linko-Preview-Og", headerValue);
  headers.set("Cache-Control", "public, max-age=0, s-maxage=300");
  return new Response(replaced, { status: res.status, headers });
}

export default async (request: Request, context: Context) => {
  if (request.method !== "GET") {
    return context.next();
  }

  const url = new URL(request.url);
  if (url.pathname === "/" || url.pathname === "") {
    return injectSeo(context, buildCompanySeoBlock(url.origin), "injected-company");
  }

  const cardMatch = url.pathname.match(/^\/c\/([^/]+)\/?$/);
  if (cardMatch) {
    const slug = decodeURIComponent(cardMatch[1]);
    const supabaseUrl = readEnv("SUPABASE_URL");
    const supabaseKey = readEnv("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseKey) {
      const res = await context.next();
      const headers = new Headers(res.headers);
      headers.set("X-Linko-Preview-Og", "skipped-card-no-env");
      return new Response(await res.text(), { status: res.status, headers });
    }

    const { card, status } = await fetchPublicCardBySlug(supabaseUrl, supabaseKey, slug);
    if (!card) {
      const res = await context.next();
      const headers = new Headers(res.headers);
      headers.set("X-Linko-Preview-Og", `skipped-card-${status}`);
      return new Response(await res.text(), { status: res.status, headers });
    }

    const base = url.origin.replace(/\/$/, "");
    const canonical = `${base}/c/${encodeURIComponent(slug)}`;
    const { title, desc, image, siteName } = ogFromCard(card, absoluteImage(base, COMPANY_OG_IMAGE_PATH));
    return injectSeo(
      context,
      buildCommonSeoBlock({ canonical, title, desc, image, siteName, type: "profile" }),
      "injected-card",
    );
  }

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

  const block = buildSeoBlock(url.origin, tempId, draft, url.searchParams.get("type"));
  return injectSeo(context, block, "injected-preview");
};

export const config = { path: ["/", "/c/*", "/preview/*"] };
