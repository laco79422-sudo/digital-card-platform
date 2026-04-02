import { seoDescription, seoTitle } from "@/lib/digitalCardViewModel";
import { SITE_OG_TITLE } from "@/lib/siteLinkPreview";
import type { BusinessCard } from "@/types/domain";
import { useEffect } from "react";

export function DigitalCardSeo({ card }: { card: BusinessCard }) {
  useEffect(() => {
    const title = seoTitle(card);
    const desc = seoDescription(card);
    document.title = title;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);

    return () => {
      document.title = SITE_OG_TITLE;
    };
  }, [card]);

  return null;
}
