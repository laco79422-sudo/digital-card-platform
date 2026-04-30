import { canonicalSiteOrigin } from "@/lib/siteOrigin";
import { SITE_OG_DESCRIPTION, SITE_OG_IMAGE_URL, SITE_OG_TITLE } from "@/lib/siteLinkPreview";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function patchMetaName(name: string, content: string) {
  const el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (el) el.setAttribute("content", content);
}

function patchMetaProperty(property: string, content: string) {
  const el = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (el) el.setAttribute("content", content);
}

/**
 * SPA `/signup` 진입 시 클라이언트 메타 보강 (크롤러는 Netlify Edge에서 처리).
 */
export function SignupSeo() {
  const location = useLocation();

  useEffect(() => {
    const origin = canonicalSiteOrigin();
    const url = `${origin}/signup${location.search}`;
    const title = "린코 디지털 명함 — 회원가입";
    const desc = SITE_OG_DESCRIPTION;
    const image = SITE_OG_IMAGE_URL;

    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);

    patchMetaProperty("og:type", "website");
    patchMetaProperty("og:url", url);
    patchMetaProperty("og:site_name", SITE_OG_TITLE);
    patchMetaProperty("og:title", title);
    patchMetaProperty("og:description", desc);
    patchMetaProperty("og:image", image);
    patchMetaProperty("og:image:secure_url", image);
    patchMetaProperty("og:image:alt", title);
    patchMetaName("twitter:card", "summary_large_image");
    patchMetaName("twitter:title", title);
    patchMetaName("twitter:description", desc);
    patchMetaName("twitter:image", image);

    const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) canonical.href = url;

    return () => {
      document.title = SITE_OG_TITLE;
    };
  }, [location.search]);

  return null;
}
