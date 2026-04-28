import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { upsertCardRemote } from "@/services/cardsService";
import {
  createEmptyDraft,
  DEFAULT_CARD_PERSON_NAME,
  draftToBusinessCard,
} from "@/stores/cardEditorDraftStore";
import type { BusinessCard } from "@/types/domain";

/** 저장·결제 로직용 원 단위 금액 */
export const EXTRA_CARD_PRICE = 10900;

function generateUniqueSlug(existing: BusinessCard[]): string {
  const taken = new Set(existing.map((c) => c.slug.trim()));
  for (let i = 0; i < 40; i++) {
    const s = `c-${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
    if (!taken.has(s)) return s;
  }
  return `c-${Date.now().toString(36)}`;
}

/**
 * Toss Payments 등 연결 시 이 함수에서 결제창을 시작합니다.
 * 개발 중에는 확인 창으로 성공 여부만 결정합니다.
 */
export async function startExtraCardPayment(): Promise<boolean> {
  return window.confirm(
    "개발용 결제 처리입니다. 10,900원 결제 성공으로 처리할까요?",
  );
}

export async function insertCardPaymentRemote(row: {
  user_id: string;
  card_id: string | null;
  type?: string;
  amount?: number;
  status?: string;
}): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const { error } = await supabase.from("card_payments").insert({
    user_id: row.user_id,
    card_id: row.card_id,
    type: row.type ?? "extra_card",
    amount: row.amount ?? EXTRA_CARD_PRICE,
    status: row.status ?? "paid",
  });
  if (error) {
    console.warn("[extraCardPaymentService] insertCardPaymentRemote", error.message);
    return false;
  }
  return true;
}

/** 게이트웨이 결제 성공 직후 원격 결제 행 저장 */
export async function handleExtraCardPaymentSuccess(opts: {
  userId: string;
  cardId: string;
  amount?: number;
}): Promise<boolean> {
  return insertCardPaymentRemote({
    user_id: opts.userId,
    card_id: opts.cardId,
    amount: opts.amount ?? EXTRA_CARD_PRICE,
    type: "extra_card",
    status: "paid",
  });
}

/** 추가 명함 1건용 초안 카드 생성 후 스토어·원격 반영 */
export async function createAdditionalCard(opts: {
  userId: string;
  userEmail: string | null | undefined;
  userName: string | null | undefined;
  existingCards: BusinessCard[];
  upsertBusinessCard: (card: BusinessCard) => void;
}): Promise<BusinessCard> {
  const slug = generateUniqueSlug(opts.existingCards);
  const draft = createEmptyDraft({
    slug,
    email: opts.userEmail?.trim() ?? "",
    person_name: opts.userName?.trim() || DEFAULT_CARD_PERSON_NAME,
  });
  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();
  const card = draftToBusinessCard(draft, {
    id,
    user_id: opts.userId,
    created_at,
  });
  opts.upsertBusinessCard(card);
  await upsertCardRemote(card);
  return card;
}
