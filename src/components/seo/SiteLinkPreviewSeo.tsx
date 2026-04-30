import { canonicalSiteOrigin } from "@/lib/siteOrigin";
import {
  SITE_CANONICAL_URL,
  SITE_OG_DESCRIPTION,
  SITE_OG_IMAGE_URL,
  SITE_OG_TITLE,
} from "@/lib/siteLinkPreview";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** index.html에 이미 있는 메타만 갱신합니다. head에 노드를 새로 붙이지 않아 React 트리·Strict Mode와 충돌을 피합니다. */
function patchMetaName(name: string, content: string) {
  const el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (el) el.setAttribute("content", content);
}

function patchMetaProperty(property: string, content: string) {
  const el = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (el) el.setAttribute("content", content);
}

/**
 * 랜딩(/) 문서 제목·미리보기 메타 동기화.
 * `/?ref=` 유입도 외부 방문자에게는 일반 메인과 동일한 OG를 사용합니다 (추적은 클라이언트·DB에서만 처리).
 */
export function SiteLinkPreviewSeo() {
  const location = useLocation();

  useEffect(() => {
    const origin = canonicalSiteOrigin().replace(/\/$/, "");
    const pageUrl = `${origin}/`;
    const title = SITE_OG_TITLE;
    const desc = SITE_OG_DESCRIPTION;
    const image = SITE_OG_IMAGE_URL;

    document.title = title;
    patchMetaName("description", desc);

    patchMetaProperty("og:type", "website");
    patchMetaProperty("og:url", pageUrl);
    patchMetaProperty("og:site_name", SITE_OG_TITLE);
    patchMetaProperty("og:title", title);
    patchMetaProperty("og:description", desc);
    patchMetaProperty("og:image", image);
    patchMetaProperty("og:image:secure_url", image);
    patchMetaProperty("og:image:type", "image/png");
    patchMetaProperty("og:image:width", "1200");
    patchMetaProperty("og:image:height", "630");
    patchMetaProperty("og:image:alt", `${title}`);
    patchMetaProperty("og:locale", "ko_KR");

    patchMetaName("twitter:card", "summary_large_image");
    patchMetaName("twitter:title", title);
    patchMetaName("twitter:description", desc);
    patchMetaName("twitter:image", image);

    const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) canonical.href = SITE_CANONICAL_URL;
  }, [location.search]);

  return null;
}
