import type { CardEditorDraft } from "@/stores/cardEditorDraftStore";
import { mergeDraftDefaults } from "@/stores/cardEditorDraftStore";
import type { CardLinkType } from "@/types/domain";

const LANDING_EMAIL_KEY = "linko-landing-email";

/** 회원 전 임시 명함 — 세션 버킷 표준 키 */
export const PENDING_CARD_SESSION_KEY = "pendingCardDraft";
/** 이전 배포 호환용 */
export const PENDING_CARD_SESSION_LEGACY_KEY = "linko-pending-card-draft";

const ENVELOPE_V = 1 as const;

export type PendingCardLinkRow = {
  id: string;
  label: string;
  type: CardLinkType;
  url: string;
};

export type PendingCardPayload = {
  draft: CardEditorDraft;
  linkRows: PendingCardLinkRow[];
  /** 게스트 편집기에서 공개 미리보기용으로 쓰는 카드 id — 레거시 */
  liveCardId?: string;
  /** 로컬 임시 미리보기(/preview) id */
  tempId?: string;
};

export type PendingCardDraftFlatSummary = {
  card_type: string;
  industry: string | null;
  name: string;
  title: string;
  intro: string;
  description: string;
  services: string;
  phone: string;
  kakao_url: string;
  image_url: string | null;
  tags: string;
  button_text: string;
  created_temp_at: string;
};

type StoredEnvelopeV1 = {
  v: typeof ENVELOPE_V;
  created_temp_at: string;
  payload: PendingCardPayload;
  summary: PendingCardDraftFlatSummary;
};



/** sessionStorage 에는 무거운/비영속 이미지(data/blob URL)만 넣지 않습니다 — 미리보기는 메모리(draft 스토어)에 유지 */
export function stripGuestHeavyMediaFromDraft(draft: CardEditorDraft): CardEditorDraft {
  const lines = draft.gallery_urls_raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !/^data:/i.test(l) && !/^blob:/i.test(l));
  const heroCandidate = draft.imageUrl ?? draft.brand_image_url;
  const hero = heroCandidate?.trim() ?? "";
  const stripHero = Boolean(hero) && (/^data:/i.test(hero) || /^blob:/i.test(hero));
  const og = draft.og_image_url?.trim() ?? "";
  const stripOg = Boolean(og) && (/^data:/i.test(og) || /^blob:/i.test(og));
  const auto = draft.auto_image_url?.trim() ?? "";
  const stripAuto = Boolean(auto) && (/^data:/i.test(auto) || /^blob:/i.test(auto));

  return {
    ...draft,
    imageUrl: stripHero ? null : draft.imageUrl,
    brand_image_url: stripHero ? null : draft.brand_image_url,
    brand_image_natural_width: stripHero ? null : draft.brand_image_natural_width,
    brand_image_natural_height: stripHero ? null : draft.brand_image_natural_height,
    brand_image_zoom: stripHero ? 1 : draft.brand_image_zoom,
    brand_image_pan_x: stripHero ? 0 : draft.brand_image_pan_x,
    brand_image_pan_y: stripHero ? 0 : draft.brand_image_pan_y,
    brand_image_legacy_object_position: stripHero ? null : draft.brand_image_legacy_object_position,
    gallery_urls_raw: lines.join("\n"),
    og_image_url: stripOg ? null : draft.og_image_url,
    auto_image_url: stripAuto ? null : draft.auto_image_url,
  };
}

function buildFlatSummary(
  normalizedPayload: PendingCardPayload,
  createdAt: string,
): PendingCardDraftFlatSummary {
  const d = mergeDraftDefaults(normalizedPayload.draft);
  const svcTitles = Array.isArray(d.services)
    ? d.services.map((s) => s.title.trim()).filter(Boolean)
    : [];
  const firstLink = normalizedPayload.linkRows?.find((r) => r.label.trim());
  const heroStored = (d.imageUrl ?? d.brand_image_url)?.trim() || null;

  return {
    card_type: d.card_type,
    industry: d.industry ?? null,
    name: d.person_name.trim(),
    title: [d.job_title.trim(), d.marketing_title.trim(), d.tagline.trim()].filter(Boolean).join(" · ") || d.job_title,
    intro: d.intro.trim(),
    description: d.intro.trim(),
    services: svcTitles.join(", "),
    phone: d.phone.trim(),
    kakao_url: d.kakao_url.trim(),
    image_url: heroStored && !/^data:/i.test(heroStored) && !/^blob:/i.test(heroStored) ? heroStored : null,
    tags: d.industry?.trim() ?? "",
    button_text: firstLink?.label.trim() ?? "",
    created_temp_at: createdAt,
  };
}

function removeAllPendingKeys() {
  try {
    sessionStorage.removeItem(PENDING_CARD_SESSION_KEY);
    sessionStorage.removeItem(PENDING_CARD_SESSION_LEGACY_KEY);
  } catch {
    /* ignore */
  }
}

function readRawEnvelope(): StoredEnvelopeV1 | PendingCardPayload | null {
  try {
    const primary = sessionStorage.getItem(PENDING_CARD_SESSION_KEY);
    const legacyRaw = primary ?? sessionStorage.getItem(PENDING_CARD_SESSION_LEGACY_KEY);
    if (!legacyRaw) return null;
    const parsed = JSON.parse(legacyRaw) as unknown;

    if (parsed && typeof parsed === "object" && "v" in parsed && (parsed as { v?: number }).v === ENVELOPE_V) {
      return parsed as StoredEnvelopeV1;
    }
    const maybePayload = parsed as PendingCardPayload;
    if (maybePayload?.draft && Array.isArray(maybePayload.linkRows)) {
      return maybePayload;
    }
    return null;
  } catch {
    return null;
  }
}

function normalizeEnvelope(raw: StoredEnvelopeV1 | PendingCardPayload): StoredEnvelopeV1 {
  if ("v" in raw && raw.v === ENVELOPE_V) return raw as StoredEnvelopeV1;

  const payload = raw as PendingCardPayload;
  const created = new Date().toISOString();
  const sanitized: PendingCardPayload = {
    ...payload,
    draft: stripGuestHeavyMediaFromDraft(mergeDraftDefaults(payload.draft)),
    linkRows: payload.linkRows ?? [],
  };

  return {
    v: ENVELOPE_V,
    created_temp_at: created,
    payload: sanitized,
    summary: buildFlatSummary(sanitized, created),
  };
}

/** 랜딩에서 시작하기로 넘긴 이메일 (명함 초안 이메일 칸에 이어 쓰기) */
export function setLandingEmail(email: string) {
  const t = email.trim();
  if (t) sessionStorage.setItem(LANDING_EMAIL_KEY, t);
  else sessionStorage.removeItem(LANDING_EMAIL_KEY);
}

export function getLandingEmail(): string | null {
  try {
    return sessionStorage.getItem(LANDING_EMAIL_KEY);
  } catch {
    return null;
  }
}

export function clearLandingEmail() {
  try {
    sessionStorage.removeItem(LANDING_EMAIL_KEY);
  } catch {
    /* ignore */
  }
}

function persistEnvelope(env: StoredEnvelopeV1) {
  const serialized = JSON.stringify(env);
  try {
    sessionStorage.setItem(PENDING_CARD_SESSION_KEY, serialized);
    sessionStorage.setItem(PENDING_CARD_SESSION_LEGACY_KEY, serialized);
  } catch {
    /* ignore */
  }
}

/** 비회원·가입 예정 초안 저장 (항상 무거운 이미지(URL) 스트립 후 기록) */
export function savePendingCardDraft(payload: PendingCardPayload) {
  const created = new Date().toISOString();
  const normalized: PendingCardPayload = {
    ...payload,
    draft: stripGuestHeavyMediaFromDraft(mergeDraftDefaults(payload.draft)),
    linkRows: payload.linkRows ?? [],
  };
  const env: StoredEnvelopeV1 = {
    v: ENVELOPE_V,
    created_temp_at: created,
    payload: normalized,
    summary: buildFlatSummary(normalized, created),
  };
  persistEnvelope(env);
}

export function peekPendingCardDraftEnvelope(): StoredEnvelopeV1 | null {
  const raw = readRawEnvelope();
  if (!raw) return null;
  return normalizeEnvelope(raw);
}

/** 페이로드만 필요할 때 — 항상 mergeDefaults + 무거운 URL 제거 상태로 반환 */
export function peekPendingCardDraft(): PendingCardPayload | null {
  const env = peekPendingCardDraftEnvelope();
  return env?.payload ?? null;
}

export function peekPendingFlatSummary(): PendingCardDraftFlatSummary | null {
  return peekPendingCardDraftEnvelope()?.summary ?? null;
}

export function consumePendingCardDraft(): PendingCardPayload | null {
  const env = peekPendingCardDraftEnvelope();
  if (!env) return null;
  removeAllPendingKeys();
  return env.payload;
}

export function hasPendingCardDraft(): boolean {
  return peekPendingCardDraft() != null;
}

/** 수동 초기화 또는 저장 성공 후 정리 등 */
export function clearPendingCardDraft() {
  removeAllPendingKeys();
}
