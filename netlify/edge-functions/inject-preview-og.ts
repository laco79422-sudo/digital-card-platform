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
  imageUrl?: string | null;
  brand_image_url?: string | null;
  gallery_urls_raw?: string;
};

type CardLike = {
  slug?: string;
  person_name?: string;
  brand_name?: string;
  job_title?: string;
  tagline?: string | null;
  intro?: string | null;
  og_image_url?: string | null;
  image_url?: string | null;
  profile_image_url?: string | null;
  imageUrl?: string | null;
  brand_image_url?: string | null;
  gallery_urls?: unknown;
};

const COMPANY_OG_TITLE = "린코 디지털 명함";
const COMPANY_OG_DESCRIPTION = "명함 하나로 고객이 먼저 찾아옵니다";
const COMPANY_BASE_URL = "https://linkoapp.kr";
const OG_DEFAULT = `${COMPANY_BASE_URL}/og-default.png`;
const OG_CARD_DEFAULT = `${COMPANY_BASE_URL}/og-card-default.png`;
const OG_REFERRAL = `${COMPANY_BASE_URL}/og-referral.png`;

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

function galleryUrlsArray(card: CardLike): string[] {
  const g = card.gallery_urls;
  if (Array.isArray(g)) return g.filter((x): x is string => typeof x === "string");
  return [];
}

function firstGalleryHttpsFromList(urls: string[]): string {
  for (const u of urls) {
    const clean = u.trim();
    if (clean.startsWith("https://")) return clean;
  }
  return "";
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
  let image = d.imageUrl?.trim() || d.brand_image_url?.trim() || "";
  if (!image.startsWith("https://")) image = firstGalleryHttps(d.gallery_urls_raw);
  if (!image.startsWith("https://")) image = fallbackImage;
  return { title, desc, image, siteName: brand };
}

function buildSeoBlock(tempId: string, d: DraftLike, queryType?: string | null): string {
  const base = COMPANY_BASE_URL;
  const t = (queryType || d.card_type || "").trim();
  const canonicalBase = `${base}/preview/${encodeURIComponent(tempId)}`;
  const canonical = t ? `${canonicalBase}?type=${encodeURIComponent(t)}` : canonicalBase;
  const fallbackImage = OG_DEFAULT;
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

function buildCompanySeoBlock(): string {
  return buildCommonSeoBlock({
    canonical: COMPANY_BASE_URL,
    title: COMPANY_OG_TITLE,
    desc: COMPANY_OG_DESCRIPTION,
    image: OG_DEFAULT,
  });
}

function ogFromCard(card: CardLike, fallbackImage: string): { title: string; desc: string; image: string; siteName: string } {
  const brand = (card.brand_name || "").trim().slice(0, 80);
  const person = (card.person_name || "").trim().slice(0, 80);
  const title = (brand && person ? `${brand} / ${person}` : brand || person || "디지털 명함").slice(0, 200);
  const desc = (
    (card.job_title || "").trim() ||
    (card.tagline || "").trim() ||
    (card.intro || "").trim() ||
    "링크 하나로 소개부터 상담까지 연결됩니다."
  ).slice(0, 300);

  let image =
    (card.og_image_url || "").trim() ||
    (card.image_url || "").trim() ||
    (card.profile_image_url || "").trim() ||
    (card.brand_image_url || "").trim();
  image = ensureOgImageHttps(image);
  if (!image.startsWith("https://")) image = firstGalleryHttpsFromList(galleryUrlsArray(card));
  image = ensureOgImageHttps(image);
  if (!image.startsWith("https://")) image = fallbackImage;

  const siteName = (card.brand_name || COMPANY_OG_TITLE).trim();
  return { title, desc, image, siteName };
}

/** 카카오·OG 스크래퍼는 https 이미지 URL을 요구하는 경우가 많음 */
function ensureOgImageHttps(url: string): string {
  const t = url.trim();
  if (!t) return "";
  if (t.startsWith("https://")) return t;
  if (t.startsWith("http://")) return `https://${t.slice("http://".length)}`;
  return t;
}

async function fetchPublicCardBySlug(
  supabaseUrl: string,
  supabaseKey: string,
  slug: string,
): Promise<{ card: CardLike | null; status: number }> {
  /** PostgREST 수동 URL에서는 카멜케이스 컬럼(imageUrl) 생략 — snake_case만 선택해 조회 안정화 */
  const cols =
    "slug,person_name,brand_name,job_title,tagline,intro,og_image_url,image_url,profile_image_url,brand_image_url,gallery_urls";
  const rest = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/business_cards?slug=eq.${encodeURIComponent(
    slug,
  )}&is_public=eq.true&select=${cols}&limit=1`;
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
    const ref = url.searchParams.get("ref")?.trim();
    const canonical = `${COMPANY_BASE_URL}/${url.search}`;
    if (ref) {
      return injectSeo(
        context,
        buildCommonSeoBlock({
          canonical,
          title: "린코 디지털 명함 — 친구 초대",
          desc: "추천 링크로 린코를 만나 보세요. 가입 후 디지털 명함을 시작할 수 있어요.",
          image: OG_REFERRAL,
        }),
        "injected-landing-ref",
      );
    }
    return injectSeo(context, buildCompanySeoBlock(), "injected-company");
  }

  /** 회원가입·추천 링크 — 린코 홍보 이미지 */
  if (url.pathname === "/signup" || url.pathname === "/signup/") {
    const canonical = `${COMPANY_BASE_URL}/signup${url.search}`;
    const ref = url.searchParams.get("ref")?.trim();
    const title = "린코 디지털 명함 — 회원가입";
    const desc = ref
      ? "추천 링크로 린코에 가입하고 디지털 명함을 시작해 보세요."
      : COMPANY_OG_DESCRIPTION;
    return injectSeo(
      context,
      buildCommonSeoBlock({
        canonical,
        title,
        desc,
        image: OG_REFERRAL,
      }),
      "injected-signup",
    );
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

    const canonical = `${COMPANY_BASE_URL}/c/${encodeURIComponent(slug)}`;
    const { title, desc, image, siteName } = ogFromCard(card, OG_CARD_DEFAULT);
    return injectSeo(
      context,
      buildCommonSeoBlock({ canonical, title, desc, image, siteName, type: "website" }),
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

  const block = buildSeoBlock(tempId, draft, url.searchParams.get("type"));
  return injectSeo(context, block, "injected-preview");
};

export const config = { path: ["/", "/signup", "/c/*", "/preview/*"] };
