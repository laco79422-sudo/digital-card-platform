import type { BusinessCard, DigitalCardServiceLine, TrustTestimonial } from "@/types/domain";
import { clampZoom } from "@/lib/brandHeroLayout";
import type { PreviewCardType } from "@/lib/previewCardType";
import { create } from "zustand";

function clampPan(n: number): number {
  return Math.max(-1, Math.min(1, n));
}

/** 편집기·미리보기가 공유하는 단일 드래프트 (리렌더·스크롤 후에도 유지) */
export type CardEditorDraft = {
  brand_name: string;
  person_name: string;
  job_title: string;
  intro: string;
  address: string;
  card_type: PreviewCardType;
  slug: string;
  phone: string;
  email: string;
  website_url: string;
  blog_url: string;
  youtube_url: string;
  kakao_url: string;
  theme: "navy" | "slate" | "midnight";
  is_public: boolean;
  tagline: string;
  trust_metric: string;
  trust_testimonials: TrustTestimonial[];
  gallery_urls_raw: string;
  services: DigitalCardServiceLine[];
  imageUrl: string | null;
  brand_image_url: string | null;
  brand_image_frame_ratio: string;
  brand_image_natural_width: number | null;
  brand_image_natural_height: number | null;
  brand_image_zoom: number;
  brand_image_pan_x: number;
  brand_image_pan_y: number;
  /** natural 미사용(구 카드)일 때 저장소에 되돌릴 cover 초점 */
  brand_image_legacy_object_position: string | null;
};

function emptyServiceRows(): DigitalCardServiceLine[] {
  return [
    { title: "", body: "" },
    { title: "", body: "" },
    { title: "", body: "" },
  ];
}

function emptyTrustTestimonial(): TrustTestimonial {
  return { quote: "", person_name: "", role: "" };
}

function normalizeTrustTestimonialRows(raw?: TrustTestimonial[] | null): TrustTestimonial[] {
  const a = raw?.[0] ?? emptyTrustTestimonial();
  const b = raw?.[1] ?? emptyTrustTestimonial();
  return [
    { quote: a.quote ?? "", person_name: a.person_name ?? "", role: a.role ?? "" },
    { quote: b.quote ?? "", person_name: b.person_name ?? "", role: b.role ?? "" },
  ];
}

/** 저장소·세션 등에서 온 초안에 빠진 필드를 채웁니다 */
export function mergeDraftDefaults(
  partial: Partial<CardEditorDraft> & { services?: CardEditorDraft["services"]; trust_line?: string },
): CardEditorDraft {
  const base = createEmptyDraft();
  const imageAliases = partial as Partial<CardEditorDraft> & {
    imageUrl?: string | null;
    profileImageUrl?: string | null;
    logoUrl?: string | null;
  };
  const resolvedImageUrl =
    imageAliases.imageUrl ??
    partial.brand_image_url ??
    imageAliases.profileImageUrl ??
    imageAliases.logoUrl ??
    base.brand_image_url;
  const services =
    partial.services && partial.services.length >= 3 ? partial.services : base.services;
  let trust_testimonials = normalizeTrustTestimonialRows(partial.trust_testimonials);
  const legacyTrust = partial.trust_line?.trim();
  if (legacyTrust && !trust_testimonials[0].quote.trim() && !trust_testimonials[1].quote.trim()) {
    trust_testimonials = [{ quote: legacyTrust, person_name: "", role: "" }, trust_testimonials[1]];
  }
  const { trust_line: _omitLegacyTrust, ...partialRest } = partial as Partial<CardEditorDraft> & {
    trust_line?: string;
  };
  return {
    ...base,
    ...partialRest,
    services,
    trust_metric: partialRest.trust_metric !== undefined ? partialRest.trust_metric : base.trust_metric,
    trust_testimonials,
    brand_image_frame_ratio: partialRest.brand_image_frame_ratio?.trim() || base.brand_image_frame_ratio,
    brand_image_natural_width:
      partialRest.brand_image_natural_width !== undefined
        ? partialRest.brand_image_natural_width
        : base.brand_image_natural_width,
    brand_image_natural_height:
      partialRest.brand_image_natural_height !== undefined
        ? partialRest.brand_image_natural_height
        : base.brand_image_natural_height,
    brand_image_zoom:
      partialRest.brand_image_zoom !== undefined && !Number.isNaN(partialRest.brand_image_zoom)
        ? clampZoom(partialRest.brand_image_zoom)
        : base.brand_image_zoom,
    brand_image_pan_x:
      partialRest.brand_image_pan_x !== undefined ? clampPan(partialRest.brand_image_pan_x) : base.brand_image_pan_x,
    brand_image_pan_y:
      partialRest.brand_image_pan_y !== undefined ? clampPan(partialRest.brand_image_pan_y) : base.brand_image_pan_y,
    imageUrl: resolvedImageUrl,
    brand_image_url: resolvedImageUrl,
    brand_image_legacy_object_position:
      partialRest.brand_image_legacy_object_position !== undefined
        ? partialRest.brand_image_legacy_object_position
        : base.brand_image_legacy_object_position ?? null,
  };
}

export function createEmptyDraft(overrides: Partial<CardEditorDraft> = {}): CardEditorDraft {
  return {
    brand_name: "",
    person_name: "",
    job_title: "",
    intro: "",
    address: "",
    card_type: "person",
    slug: "",
    phone: "",
    email: "",
    website_url: "",
    blog_url: "",
    youtube_url: "",
    kakao_url: "",
    theme: "navy",
    is_public: true,
    tagline: "",
    trust_metric: "",
    trust_testimonials: [emptyTrustTestimonial(), emptyTrustTestimonial()],
    gallery_urls_raw: "",
    services: emptyServiceRows(),
    imageUrl: null,
    brand_image_url: null,
    brand_image_frame_ratio: "16:9",
    brand_image_natural_width: null,
    brand_image_natural_height: null,
    brand_image_zoom: 1,
    brand_image_pan_x: 0,
    brand_image_pan_y: 0,
    brand_image_legacy_object_position: null,
    ...overrides,
  };
}

export function draftFromBusinessCard(card: BusinessCard): CardEditorDraft {
  const imageAliases = card as BusinessCard & {
    imageUrl?: string | null;
    profileImageUrl?: string | null;
    logoUrl?: string | null;
  };
  const svc = card.services?.length ? [...card.services] : [];
  while (svc.length < 3) svc.push({ title: "", body: "" });
  return {
    brand_name: card.brand_name,
    person_name: card.person_name,
    job_title: card.job_title,
    intro: card.intro,
    address: "",
    card_type: "person",
    slug: card.slug,
    phone: card.phone ?? "",
    email: card.email ?? "",
    website_url: card.website_url ?? "",
    blog_url: card.blog_url ?? "",
    youtube_url: card.youtube_url ?? "",
    kakao_url: card.kakao_url ?? "",
    theme: card.theme,
    is_public: card.is_public,
    tagline: card.tagline ?? "",
    trust_metric: card.trust_metric ?? "",
    trust_testimonials: normalizeTrustTestimonialRows(
      card.trust_testimonials?.filter((t) => t.quote.trim()).length
        ? card.trust_testimonials
        : card.trust_line?.trim()
          ? [{ quote: card.trust_line, person_name: "", role: "" }]
          : undefined,
    ),
    gallery_urls_raw: card.gallery_urls?.join("\n") ?? "",
    services: svc.slice(0, 5),
    imageUrl: card.imageUrl ?? card.brand_image_url ?? imageAliases.profileImageUrl ?? imageAliases.logoUrl ?? null,
    brand_image_url: card.imageUrl ?? card.brand_image_url ?? imageAliases.profileImageUrl ?? imageAliases.logoUrl ?? null,
    brand_image_frame_ratio: card.brand_image_frame_ratio?.trim() || "16:9",
    brand_image_natural_width: card.brand_image_natural_width ?? null,
    brand_image_natural_height: card.brand_image_natural_height ?? null,
    brand_image_zoom:
      typeof card.brand_image_zoom === "number" && !Number.isNaN(card.brand_image_zoom)
        ? clampZoom(card.brand_image_zoom)
        : 1,
    brand_image_pan_x: clampPan(typeof card.brand_image_pan_x === "number" ? card.brand_image_pan_x : 0),
    brand_image_pan_y: clampPan(typeof card.brand_image_pan_y === "number" ? card.brand_image_pan_y : 0),
    brand_image_legacy_object_position:
      card.brand_image_natural_width && card.brand_image_natural_height
        ? null
        : (card.brand_image_object_position?.trim() ?? null),
  };
}

/** 미리보기용 — 입력하지 않은 텍스트는 화면에 기본 문구로 보완하지 않습니다. */
export function draftToPreviewBusinessCard(
  draft: CardEditorDraft,
  meta: { userId: string; cardId?: string; createdAt?: string },
): BusinessCard {
  const base = draftToBusinessCard(draft, {
    id: meta.cardId ?? "preview",
    user_id: meta.userId,
    created_at: meta.createdAt ?? new Date().toISOString(),
  });
  return {
    ...base,
    slug: base.slug || "preview",
  };
}

export function draftToBusinessCard(
  draft: CardEditorDraft,
  opts: { id: string; user_id: string; created_at: string },
): BusinessCard {
  const galleryList = draft.gallery_urls_raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const serviceList = draft.services.filter((s) => s.title.trim() && s.body.trim());
  const hasNewHeroMeta =
    draft.brand_image_natural_width != null &&
    draft.brand_image_natural_height != null &&
    draft.brand_image_natural_width > 0 &&
    draft.brand_image_natural_height > 0;

  const trimmedTestimonials = draft.trust_testimonials
    .map((t) => ({
      quote: t.quote.trim(),
      person_name: t.person_name.trim(),
      role: t.role.trim(),
    }))
    .filter((t) => t.quote.length > 0);
  const trust_testimonials = trimmedTestimonials.length > 0 ? trimmedTestimonials : null;
  const trust_line = trimmedTestimonials[0]?.quote ?? null;
  const trust_metric = draft.trust_metric.trim() || null;
  const imageUrl = (draft.imageUrl ?? draft.brand_image_url)?.trim() || null;

  return {
    id: opts.id,
    user_id: opts.user_id,
    slug: draft.slug.trim(),
    brand_name: draft.brand_name.trim(),
    person_name: draft.person_name.trim(),
    job_title: draft.job_title.trim(),
    intro: draft.intro.trim(),
    phone: draft.phone.trim() || null,
    email: draft.email.trim() || null,
    website_url: draft.website_url.trim() || null,
    blog_url: draft.blog_url.trim() || null,
    youtube_url: draft.youtube_url.trim() || null,
    kakao_url: draft.kakao_url.trim() || null,
    theme: draft.theme,
    is_public: draft.is_public,
    created_at: opts.created_at,
    tagline: draft.tagline.trim() || null,
    trust_line,
    trust_metric,
    trust_testimonials,
    gallery_urls: galleryList.length > 0 ? galleryList : null,
    services: serviceList.length > 0 ? serviceList : null,
    brand_image_frame_ratio: draft.brand_image_frame_ratio?.trim() || "16:9",
    imageUrl,
    brand_image_url: imageUrl,
    brand_image_natural_width: hasNewHeroMeta ? draft.brand_image_natural_width : null,
    brand_image_natural_height: hasNewHeroMeta ? draft.brand_image_natural_height : null,
    brand_image_zoom: hasNewHeroMeta ? clampZoom(draft.brand_image_zoom) : null,
    brand_image_pan_x: hasNewHeroMeta ? clampPan(draft.brand_image_pan_x) : null,
    brand_image_pan_y: hasNewHeroMeta ? clampPan(draft.brand_image_pan_y) : null,
    brand_image_object_position: hasNewHeroMeta
      ? null
      : draft.brand_image_legacy_object_position?.trim() || null,
  };
}

type CardEditorDraftState = {
  /** 마지막으로 주입한 라우트 키 (`new` 또는 카드 id) */
  hydratedKey: string | null;
  draft: CardEditorDraft;
  setDraft: (patch: Partial<CardEditorDraft>) => void;
  replaceDraft: (draft: CardEditorDraft) => void;
  setServiceRow: (index: number, patch: Partial<DigitalCardServiceLine>) => void;
  appendServiceRow: () => void;
  removeServiceRow: (index: number) => void;
  setTrustTestimonialRow: (index: 0 | 1, patch: Partial<TrustTestimonial>) => void;
  setHydratedKey: (key: string | null) => void;
};

export const useCardEditorDraftStore = create<CardEditorDraftState>((set) => ({
  hydratedKey: null,
  draft: createEmptyDraft(),
  setDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
  replaceDraft: (draft) => set({ draft }),
  setServiceRow: (index, patch) =>
    set((s) => {
      const services = s.draft.services.map((row, i) => (i === index ? { ...row, ...patch } : row));
      return { draft: { ...s.draft, services } };
    }),
  appendServiceRow: () =>
    set((s) => {
      if (s.draft.services.length >= 5) return s;
      return { draft: { ...s.draft, services: [...s.draft.services, { title: "", body: "" }] } };
    }),
  removeServiceRow: (index) =>
    set((s) => {
      if (s.draft.services.length <= 3) return s;
      const services = s.draft.services.filter((_, i) => i !== index);
      return { draft: { ...s.draft, services } };
    }),
  setTrustTestimonialRow: (index, patch) =>
    set((s) => {
      const trust_testimonials = s.draft.trust_testimonials.map((row, i) =>
        i === index ? { ...row, ...patch } : row,
      );
      return { draft: { ...s.draft, trust_testimonials } };
    }),
  setHydratedKey: (key) => set({ hydratedKey: key }),
}));
