import { BRAND_DISPLAY_NAME } from "@/lib/brand";
import { SITE_OG_IMAGE_URL } from "@/lib/siteLinkPreview";
import type { BusinessCard } from "@/types/domain";
import type { CardEditorDraft } from "@/stores/cardEditorDraftStore";

const FALLBACK_DESC = "명함 미리보기";

function firstHttpsUrlFromGalleryRaw(raw: string | undefined): string {
  if (!raw?.trim()) return "";
  for (const line of raw.split("\n")) {
    const u = line.trim();
    if (u.startsWith("https://")) return u;
  }
  return "";
}

/** Kakao / Open Graph — og:image must be an absolute https URL. */
export function previewOgImageUrlFromDraft(
  draft: Pick<CardEditorDraft, "brand_image_url" | "gallery_urls_raw">,
  fallbackHttps: string = SITE_OG_IMAGE_URL,
): string {
  const hero = draft.brand_image_url?.trim();
  if (hero?.startsWith("https://")) return hero;
  const g = firstHttpsUrlFromGalleryRaw(draft.gallery_urls_raw);
  if (g) return g;
  return fallbackHttps;
}

export function previewOgTitleFromDraft(draft: Pick<CardEditorDraft, "person_name" | "brand_name">): string {
  const person = (draft.person_name || "이름").trim();
  const brand = (draft.brand_name || BRAND_DISPLAY_NAME).trim();
  return `${person} | ${brand}`.slice(0, 80);
}

export function previewOgDescriptionFromDraft(
  draft: Pick<CardEditorDraft, "tagline" | "intro">,
): string {
  const t = draft.tagline?.trim();
  if (t) return t.slice(0, 300);
  return (draft.intro || "").trim().slice(0, 300);
}

export function previewKakaoFeedFromDraft(
  draft: CardEditorDraft,
  opts?: { fallbackImage?: string },
): { title: string; description: string; imageUrl: string } {
  return {
    title: previewOgTitleFromDraft(draft),
    description: previewOgDescriptionFromDraft(draft) || FALLBACK_DESC,
    imageUrl: previewOgImageUrlFromDraft(draft, opts?.fallbackImage ?? SITE_OG_IMAGE_URL),
  };
}

export function previewKakaoFeedFromBusinessCard(
  card: BusinessCard,
  opts?: { fallbackImage?: string },
): { title: string; description: string; imageUrl: string } {
  const draftLike = {
    person_name: card.person_name,
    brand_name: card.brand_name,
    tagline: card.tagline ?? "",
    intro: card.intro,
    brand_image_url: card.brand_image_url ?? null,
    gallery_urls_raw: card.gallery_urls?.join("\n") ?? "",
  };
  return {
    title: previewOgTitleFromDraft(draftLike),
    description:
      (card.tagline?.trim() || card.intro?.trim() || "").slice(0, 300) || FALLBACK_DESC,
    imageUrl: previewOgImageUrlFromDraft(draftLike, opts?.fallbackImage ?? SITE_OG_IMAGE_URL),
  };
}
