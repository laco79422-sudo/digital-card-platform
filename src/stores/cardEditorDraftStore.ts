import type { BusinessCard, DigitalCardServiceLine } from "@/types/domain";
import { clampZoom } from "@/lib/brandHeroLayout";
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
  trust_line: string;
  gallery_urls_raw: string;
  services: DigitalCardServiceLine[];
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

/** 저장소·세션 등에서 온 초안에 빠진 필드를 채웁니다 */
export function mergeDraftDefaults(partial: Partial<CardEditorDraft> & { services?: CardEditorDraft["services"] }): CardEditorDraft {
  const base = createEmptyDraft();
  const services =
    partial.services && partial.services.length >= 3 ? partial.services : base.services;
  return {
    ...base,
    ...partial,
    services,
    brand_image_frame_ratio: partial.brand_image_frame_ratio?.trim() || base.brand_image_frame_ratio,
    brand_image_natural_width:
      partial.brand_image_natural_width !== undefined
        ? partial.brand_image_natural_width
        : base.brand_image_natural_width,
    brand_image_natural_height:
      partial.brand_image_natural_height !== undefined
        ? partial.brand_image_natural_height
        : base.brand_image_natural_height,
    brand_image_zoom:
      partial.brand_image_zoom !== undefined && !Number.isNaN(partial.brand_image_zoom)
        ? clampZoom(partial.brand_image_zoom)
        : base.brand_image_zoom,
    brand_image_pan_x:
      partial.brand_image_pan_x !== undefined ? clampPan(partial.brand_image_pan_x) : base.brand_image_pan_x,
    brand_image_pan_y:
      partial.brand_image_pan_y !== undefined ? clampPan(partial.brand_image_pan_y) : base.brand_image_pan_y,
    brand_image_url: partial.brand_image_url !== undefined ? partial.brand_image_url : base.brand_image_url,
    brand_image_legacy_object_position:
      partial.brand_image_legacy_object_position !== undefined
        ? partial.brand_image_legacy_object_position
        : base.brand_image_legacy_object_position ?? null,
  };
}

export function createEmptyDraft(overrides: Partial<CardEditorDraft> = {}): CardEditorDraft {
  return {
    brand_name: "",
    person_name: "",
    job_title: "",
    intro: "",
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
    trust_line: "",
    gallery_urls_raw: "",
    services: emptyServiceRows(),
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
  const svc = card.services?.length ? [...card.services] : [];
  while (svc.length < 3) svc.push({ title: "", body: "" });
  return {
    brand_name: card.brand_name,
    person_name: card.person_name,
    job_title: card.job_title,
    intro: card.intro,
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
    trust_line: card.trust_line ?? "",
    gallery_urls_raw: card.gallery_urls?.join("\n") ?? "",
    services: svc.slice(0, 5),
    brand_image_url: card.brand_image_url ?? null,
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

/** 미리보기용 — 빈 필드는 placeholder 문구로만 보완 (저장값 변경 없음) */
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
    brand_name: base.brand_name || "브랜드명",
    person_name: base.person_name || "이름",
    job_title: base.job_title || "직함",
    intro: base.intro || "소개를 입력해 주세요.",
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
    trust_line: draft.trust_line.trim() || null,
    gallery_urls: galleryList.length > 0 ? galleryList : null,
    services: serviceList.length > 0 ? serviceList : null,
    brand_image_frame_ratio: draft.brand_image_frame_ratio?.trim() || "16:9",
    brand_image_url: draft.brand_image_url?.trim() ? draft.brand_image_url : null,
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
  setHydratedKey: (key) => set({ hydratedKey: key }),
}));
