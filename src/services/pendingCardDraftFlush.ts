import { isEmailConfirmed } from "@/lib/auth/authActions";
import { parseCardEditorDraft } from "@/lib/cardEditorSchema";
import {
  peekPendingCardDraft,
  consumePendingCardDraft,
  peekPendingHeroResumeAfterAuth,
  type PendingCardLinkRow,
} from "@/lib/pendingCardStorage";
import { removeTempCard } from "@/lib/tempCardStorage";
import { clearGuestTempId } from "@/lib/guestTempSession";
import {
  draftToBusinessCard,
  mergeDraftDefaults,
  type CardEditorDraft,
} from "@/stores/cardEditorDraftStore";
import { upsertCardRemote, isSlugTakenOnRemoteByAnotherCard } from "@/services/cardsService";
import { getSupabaseConfigErrorMessage, isSupabaseConfigured } from "@/lib/supabase/client";
import { syncQrImageAfterSave } from "@/services/cardQrSync";
import { useAppDataStore } from "@/stores/appDataStore";
import type { BusinessCard, CardLink, User } from "@/types/domain";

/** React Router `location.state` — 내 공간에서 자동 저장 완료 안내 */
export const SHOW_PENDING_CARD_SAVED_STATE = "showPendingCardSaved" as const;

function linkRowsToCardLinks(rows: PendingCardLinkRow[], draft: CardEditorDraft, cardId: string): CardLink[] {
  const filtered = rows.filter((r) => r.label.trim() && r.url.trim());
  if (filtered.length > 0) {
    return filtered.map((r, i) => ({
      id: r.id,
      card_id: cardId,
      label: r.label,
      type: r.type,
      url: r.url,
      sort_order: i,
    }));
  }
  return [
    {
      id: crypto.randomUUID(),
      card_id: cardId,
      label: "웹사이트",
      type: "website",
      url: draft.website_url.trim() || "https://example.com",
      sort_order: 0,
    },
  ];
}

function slugTakenLocal(slug: string, excludeId: string, businessCards: BusinessCard[]): boolean {
  return businessCards.some((c) => c.slug === slug && c.id !== excludeId);
}

async function pickUniqueSlug(seed: string, cardId: string, businessCards: BusinessCard[]): Promise<string> {
  let base = seed.trim().toLowerCase();
  if (!base || base.length < 2) {
    base = `card-${crypto.randomUUID().slice(0, 8)}`;
  }
  for (let n = 0; n < 48; n += 1) {
    const suffix = n === 0 ? "" : `-${n}`;
    const candidate = `${base}${suffix}`.slice(0, 120);

    if (slugTakenLocal(candidate, cardId, businessCards)) continue;

    const remote = await isSlugTakenOnRemoteByAnotherCard(candidate, cardId);
    if (remote === true) continue;

    return candidate;
  }
  const fallback = `card-${crypto.randomUUID().slice(0, 10)}`;
  return fallback.slice(0, 120);
}

const flushQueues = new Map<string, Promise<PersistPendingCardDraftResult>>();

export type PersistPendingCardDraftResult = {
  saved: boolean;
  error?: string;
};

/**
 * 이메일 인증까지 완료된 로그인 사용자에 대해 `pendingCardDraft`를 서버 명함으로 저장합니다.
 * 원격 저장에 성공한 경우에만 세션 초안을 제거합니다.
 */
export async function tryFlushPendingCardDraftForAuthenticatedUser(user: User): Promise<PersistPendingCardDraftResult> {
  const existing = flushQueues.get(user.id);
  if (existing) return existing;

  const run = async (): Promise<PersistPendingCardDraftResult> => {
    if (!isEmailConfirmed({ email_confirmed_at: user.email_confirmed_at ?? undefined })) {
      return { saved: false };
    }

    /** 히어로만 이어하기: 내용은 `/cards/new`에서 복원 — 자동 저장·초안 삭제 없음 */
    if (peekPendingHeroResumeAfterAuth() && peekPendingCardDraft()) {
      return { saved: false };
    }

    const peeked = peekPendingCardDraft();
    if (!peeked?.draft || !isSupabaseConfigured) {
      return { saved: false };
    }

    const merged = mergeDraftDefaults(peeked.draft);
    const parsed = parseCardEditorDraft(merged);
    if (!parsed.success) {
      return {
        saved: false,
        error:
          "임시 저장된 초안 형식이 맞지 않습니다. 명함 만들기 화면에서 내용을 확인한 뒤 다시 저장해 주세요.",
      };
    }

    const baseline = mergeDraftDefaults(parsed.data);
    const cardId = crypto.randomUUID();
    const businessCards = useAppDataStore.getState().businessCards;
    const slug = await pickUniqueSlug(baseline.slug, cardId, businessCards);
    const draftWorking = mergeDraftDefaults(
      slug === baseline.slug.trim() ? baseline : { ...baseline, slug },
    );

    let card = draftToBusinessCard(draftWorking, {
      id: cardId,
      user_id: user.id,
      created_at: new Date().toISOString(),
    });
    card = { ...card, status: card.status ?? "active", is_public: card.is_public !== false };

    useAppDataStore.getState().upsertBusinessCard(card);
    const persisted = await upsertCardRemote(card);
    if (!persisted) {
      useAppDataStore.getState().removeBusinessCard(cardId);
      return {
        saved: false,
        error: getSupabaseConfigErrorMessage() || "네트워크 오류로 명함을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      };
    }

    try {
      const synced = await syncQrImageAfterSave(card);
      useAppDataStore.getState().upsertBusinessCard(synced);
      await upsertCardRemote(synced);
    } catch (e) {
      console.warn("[pendingCardDraftFlush] QR 동기화", e);
    }

    const links = linkRowsToCardLinks(peeked.linkRows ?? [], draftWorking, cardId);
    useAppDataStore.getState().setCardLinks(cardId, links);

    consumePendingCardDraft();

    const tempId = peeked.tempId;
    if (tempId) {
      removeTempCard(tempId);
      clearGuestTempId();
    }

    return { saved: true };
  };

  const promise = run().finally(() => flushQueues.delete(user.id));
  flushQueues.set(user.id, promise);
  return promise;
}
