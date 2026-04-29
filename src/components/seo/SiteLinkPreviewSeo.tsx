import { canonicalSiteOrigin } from "@/lib/siteOrigin";
import {
  SITE_CANONICAL_URL,
  SITE_OG_DESCRIPTION,
  SITE_OG_IMAGE_URL,
  SITE_OG_REFERRAL_IMAGE_URL,
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

/** 랜딩(/)에서 문서 제목·미리보기 메타를 동기화. `/?ref=` 는 추천용 OG (Netlify Edge와 동일 문구). */
export function SiteLinkPreviewSeo() {
  const location = useLocation();

  useEffect(() => {
    const ref = new URLSearchParams(location.search).get("ref")?.trim();
    const origin = canonicalSiteOrigin().replace(/\/$/, "");
    const pageUrl = ref ? `${origin}/?ref=${encodeURIComponent(ref)}` : SITE_CANONICAL_URL;
    const title = ref ? "린코 디지털 명함 — 친구 초대" : SITE_OG_TITLE;
    const desc = ref
      ? "추천 링크로 린코를 만나 보세요. 가입 후 디지털 명함을 시작할 수 있어요."
      : SITE_OG_DESCRIPTION;
    const image = ref ? SITE_OG_REFERRAL_IMAGE_URL : SITE_OG_IMAGE_URL;

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
    if (canonical) canonical.href = pageUrl;
  }, [location.search]);

  return null;
}
