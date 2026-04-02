import {
  SITE_CANONICAL_URL,
  SITE_OG_DESCRIPTION,
  SITE_OG_IMAGE_URL,
  SITE_OG_TITLE,
} from "@/lib/siteLinkPreview";
import { useEffect } from "react";

/** index.html에 이미 있는 메타만 갱신합니다. head에 노드를 새로 붙이지 않아 React 트리·Strict Mode와 충돌을 피합니다. */
function patchMetaName(name: string, content: string) {
  const el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (el) el.setAttribute("content", content);
}

function patchMetaProperty(property: string, content: string) {
  const el = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (el) el.setAttribute("content", content);
}

/** 랜딩(/)에서 문서 제목·미리보기 메타를 index.html과 동기화 (appendChild 없음) */
export function SiteLinkPreviewSeo() {
  useEffect(() => {
    document.title = SITE_OG_TITLE;
    patchMetaName("description", SITE_OG_DESCRIPTION);

    patchMetaProperty("og:type", "website");
    patchMetaProperty("og:url", SITE_CANONICAL_URL);
    patchMetaProperty("og:site_name", SITE_OG_TITLE);
    patchMetaProperty("og:title", SITE_OG_TITLE);
    patchMetaProperty("og:description", SITE_OG_DESCRIPTION);
    patchMetaProperty("og:image", SITE_OG_IMAGE_URL);
    patchMetaProperty("og:image:secure_url", SITE_OG_IMAGE_URL);
    patchMetaProperty("og:image:type", "image/png");
    patchMetaProperty("og:image:width", "1200");
    patchMetaProperty("og:image:height", "630");
    patchMetaProperty("og:image:alt", `${SITE_OG_TITLE} — 업무용 프로필 공유`);
    patchMetaProperty("og:locale", "ko_KR");

    patchMetaName("twitter:card", "summary_large_image");
    patchMetaName("twitter:title", SITE_OG_TITLE);
    patchMetaName("twitter:description", SITE_OG_DESCRIPTION);
    patchMetaName("twitter:image", SITE_OG_IMAGE_URL);

    const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) canonical.href = SITE_CANONICAL_URL;
  }, []);

  return null;
}
