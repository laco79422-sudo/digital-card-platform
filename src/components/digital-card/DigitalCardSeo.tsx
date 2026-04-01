import { seoDescription, seoTitle } from "@/lib/digitalCardViewModel";
import type { BusinessCard } from "@/types/domain";
import { useEffect } from "react";

const DEFAULT_TITLE = "Linko 디지털 명함 - 연결되는 나의 시작";

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
      document.title = DEFAULT_TITLE;
    };
  }, [card]);

  return null;
}
