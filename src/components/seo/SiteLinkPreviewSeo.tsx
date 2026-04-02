import {
  SITE_CANONICAL_URL,
  SITE_OG_DESCRIPTION,
  SITE_OG_IMAGE_URL,
  SITE_OG_TITLE,
} from "@/lib/siteLinkPreview";
import { useEffect } from "react";

function setMetaProperty(property: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[property="${property}"]`,
  );
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setMetaName(name: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/** 랜딩(/)에서 링크 스크래퍼·클라이언트 모두 동일한 OG/Twitter 메타를 쓰도록 맞춤 */
export function SiteLinkPreviewSeo() {
  useEffect(() => {
    document.title = SITE_OG_TITLE;
    setMetaName("description", SITE_OG_DESCRIPTION);

    setMetaProperty("og:type", "website");
    setMetaProperty("og:url", SITE_CANONICAL_URL);
    setMetaProperty("og:site_name", SITE_OG_TITLE);
    setMetaProperty("og:title", SITE_OG_TITLE);
    setMetaProperty("og:description", SITE_OG_DESCRIPTION);
    setMetaProperty("og:image", SITE_OG_IMAGE_URL);
    setMetaProperty("og:image:secure_url", SITE_OG_IMAGE_URL);
    setMetaProperty("og:image:type", "image/png");
    setMetaProperty("og:image:width", "1200");
    setMetaProperty("og:image:height", "630");
    setMetaProperty("og:image:alt", `${SITE_OG_TITLE} — 업무용 프로필 공유`);
    setMetaProperty("og:locale", "ko_KR");

    setMetaName("twitter:card", "summary_large_image");
    setMetaName("twitter:title", SITE_OG_TITLE);
    setMetaName("twitter:description", SITE_OG_DESCRIPTION);
    setMetaName("twitter:image", SITE_OG_IMAGE_URL);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = SITE_CANONICAL_URL;
  }, []);

  return null;
}
