import type { BusinessCard, DigitalCardServiceLine } from "@/types/domain";
import { create } from "zustand";

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
};

function emptyServiceRows(): DigitalCardServiceLine[] {
  return [
    { title: "", body: "" },
    { title: "", body: "" },
    { title: "", body: "" },
  ];
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
    brand_image_url: draft.brand_image_url?.trim() ? draft.brand_image_url : null,
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
