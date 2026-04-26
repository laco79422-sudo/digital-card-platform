import { seoDescription, seoTitle } from "@/lib/digitalCardViewModel";
import { previewOgImageUrlFromDraft } from "@/lib/previewShareMeta";
import { SITE_OG_TITLE } from "@/lib/siteLinkPreview";
import type { BusinessCard } from "@/types/domain";
import { useEffect } from "react";

function patchMetaName(name: string, content: string) {
  const el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (el) el.setAttribute("content", content);
}

function patchMetaProperty(property: string, content: string) {
  const el = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (el) el.setAttribute("content", content);
}

export function DigitalCardSeo({ card }: { card: BusinessCard }) {
  useEffect(() => {
    const title = `${card.person_name || card.brand_name} | ${card.job_title || "디지털 명함"}`.trim() || seoTitle(card);
    const desc = seoDescription(card);
    const imageUrl = previewOgImageUrlFromDraft({
      brand_image_url: card.brand_image_url ?? null,
      gallery_urls_raw: card.gallery_urls?.join("\n") ?? "",
    });
    const url = `${window.location.origin}/c/${encodeURIComponent(card.slug)}`;
    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);

    patchMetaProperty("og:type", "profile");
    patchMetaProperty("og:url", url);
    patchMetaProperty("og:site_name", card.brand_name || SITE_OG_TITLE);
    patchMetaProperty("og:title", title);
    patchMetaProperty("og:description", desc);
    patchMetaProperty("og:image", imageUrl);
    patchMetaProperty("og:image:secure_url", imageUrl);
    patchMetaProperty("og:image:alt", title);
    patchMetaName("twitter:card", "summary_large_image");
    patchMetaName("twitter:title", title);
    patchMetaName("twitter:description", desc);
    patchMetaName("twitter:image", imageUrl);

    const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) canonical.href = url;

    return () => {
      document.title = SITE_OG_TITLE;
    };
  }, [card]);

  return null;
}
