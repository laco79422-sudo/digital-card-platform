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

/** 임시 미리보기용 — HTML OG·카카오 SDK와 동일한 절대 URL */
export function previewOgImageEndpointUrl(origin: string, tempId: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}/.netlify/functions/preview-og-image?tempId=${encodeURIComponent(tempId)}`;
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

function clamp(s: string, max: number): string {
  return s.trim().slice(0, max);
}

export function previewOgTitleFromDraft(draft: Pick<CardEditorDraft, "person_name" | "brand_name">): string {
  const person = clamp(draft.person_name || "", 80);
  if (person) return person;
  const brand = clamp(draft.brand_name || BRAND_DISPLAY_NAME, 80);
  return brand || "이름";
}

export function previewOgDescriptionFromDraft(
  draft: Pick<CardEditorDraft, "tagline" | "intro" | "brand_name">,
): string {
  const brand = clamp(draft.brand_name || BRAND_DISPLAY_NAME, 80);
  const headline = clamp(draft.tagline || draft.intro || "", 300);
  if (brand && headline) return `${brand} · ${headline}`.slice(0, 300);
  if (brand) return brand.slice(0, 300);
  return headline.slice(0, 300);
}

export function previewKakaoFeedFromDraft(
  draft: CardEditorDraft,
  opts?: { fallbackImage?: string; tempId?: string; origin?: string },
): { title: string; description: string; imageUrl: string } {
  const imageUrl =
    opts?.tempId && opts?.origin
      ? previewOgImageEndpointUrl(opts.origin, opts.tempId)
      : previewOgImageUrlFromDraft(draft, opts?.fallbackImage ?? SITE_OG_IMAGE_URL);
  return {
    title: previewOgTitleFromDraft(draft),
    description: previewOgDescriptionFromDraft(draft) || FALLBACK_DESC,
    imageUrl,
  };
}

/** /preview/{tempId} 공개 화면 — 카카오 피드가 OG 엔드포인트·문구와 맞도록 */
export function tempPreviewKakaoFeedFromCard(
  card: BusinessCard,
  origin: string,
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
    description: previewOgDescriptionFromDraft(draftLike) || FALLBACK_DESC,
    imageUrl: previewOgImageEndpointUrl(origin, card.id),
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
    description: previewOgDescriptionFromDraft(draftLike) || FALLBACK_DESC,
    imageUrl: previewOgImageUrlFromDraft(draftLike, opts?.fallbackImage ?? SITE_OG_IMAGE_URL),
  };
}
