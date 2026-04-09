import type { CardEditorDraft } from "@/stores/cardEditorDraftStore";
import type { CardLinkType } from "@/types/domain";

const LANDING_EMAIL_KEY = "linko-landing-email";
const PENDING_CARD_KEY = "linko-pending-card-draft";

export type PendingCardLinkRow = {
  id: string;
  label: string;
  type: CardLinkType;
  url: string;
};

export type PendingCardPayload = {
  draft: CardEditorDraft;
  linkRows: PendingCardLinkRow[];
  /** 게스트 편집기에서 공개 미리보기용으로 쓰는 카드 id (가입 시 소유권 이전) */
  liveCardId?: string;
};

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

export function savePendingCardDraft(payload: PendingCardPayload) {
  sessionStorage.setItem(PENDING_CARD_KEY, JSON.stringify(payload));
}

export function peekPendingCardDraft(): PendingCardPayload | null {
  try {
    const raw = sessionStorage.getItem(PENDING_CARD_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingCardPayload;
  } catch {
    return null;
  }
}

export function consumePendingCardDraft(): PendingCardPayload | null {
  const p = peekPendingCardDraft();
  if (p) {
    try {
      sessionStorage.removeItem(PENDING_CARD_KEY);
    } catch {
      /* ignore */
    }
  }
  return p;
}

export function hasPendingCardDraft(): boolean {
  return peekPendingCardDraft() != null;
}
