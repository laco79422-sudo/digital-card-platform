import { buildPreviewMeta } from "@/lib/previewCardType";
import { SITE_OG_CARD_FALLBACK_URL, SITE_OG_IMAGE_URL } from "@/lib/siteLinkPreview";
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
  draft: Pick<CardEditorDraft, "brand_image_url" | "gallery_urls_raw"> & {
    imageUrl?: string | null;
    image_url?: string | null;
    profile_image_url?: string | null;
  },
  fallbackHttps: string = SITE_OG_IMAGE_URL,
): string {
  const hero =
    draft.image_url?.trim() ||
    draft.profile_image_url?.trim() ||
    draft.imageUrl?.trim() ||
    draft.brand_image_url?.trim();
  const normalized = hero?.startsWith("http://") ? `https://${hero.slice("http://".length)}` : hero;
  if (normalized?.startsWith("https://")) return normalized;
  const g = firstHttpsUrlFromGalleryRaw(draft.gallery_urls_raw);
  if (g) return g.startsWith("http://") ? `https://${g.slice("http://".length)}` : g;
  return fallbackHttps;
}

/** 공개 명함 페이지 OG — og_image_url 우선, 없으면 대표 이미지·갤러리, 마지막으로 명함 전용 폴백 PNG */
export function cardOgImageHttps(card: BusinessCard): string {
  const og = card.og_image_url?.trim();
  const ogNorm = og?.startsWith("http://") ? `https://${og.slice("http://".length)}` : og;
  if (ogNorm?.startsWith("https://")) return ogNorm;
  return previewOgImageUrlFromDraft(
    {
      image_url: card.image_url ?? null,
      profile_image_url: card.profile_image_url ?? null,
      imageUrl: card.imageUrl ?? null,
      brand_image_url: card.brand_image_url ?? null,
      gallery_urls_raw: card.gallery_urls?.join("\n") ?? "",
    },
    SITE_OG_CARD_FALLBACK_URL,
  );
}

export function previewOgTitleFromDraft(draft: Pick<CardEditorDraft, "person_name" | "brand_name">): string {
  return buildPreviewMeta({
    type: (draft as Partial<CardEditorDraft>).card_type ?? "person",
    person_name: draft.person_name,
    brand_name: draft.brand_name,
  }).title;
}

export function previewOgDescriptionFromDraft(
  draft: Pick<CardEditorDraft, "tagline" | "intro" | "brand_name" | "address" | "person_name" | "trust_metric">,
): string {
  return buildPreviewMeta({
    type: (draft as Partial<CardEditorDraft>).card_type ?? "person",
    person_name: draft.person_name,
    brand_name: draft.brand_name,
    tagline: draft.tagline,
    intro: draft.intro,
    address: (draft as Partial<CardEditorDraft>).address,
    trust_metric: (draft as Partial<CardEditorDraft>).trust_metric,
  }).description;
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
    address: "",
    trust_metric: card.trust_metric ?? "",
    imageUrl: card.imageUrl ?? null,
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
    address: "",
    trust_metric: card.trust_metric ?? "",
    imageUrl: card.imageUrl ?? null,
    brand_image_url: card.brand_image_url ?? null,
    gallery_urls_raw: card.gallery_urls?.join("\n") ?? "",
  };
  return {
    title: previewOgTitleFromDraft(draftLike),
    description: previewOgDescriptionFromDraft(draftLike) || FALLBACK_DESC,
    imageUrl: previewOgImageUrlFromDraft(draftLike, opts?.fallbackImage ?? SITE_OG_IMAGE_URL),
  };
}
