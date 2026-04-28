/**
 * Supabase 테이블(business_cards, card_links 등)과 연동할 때 사용하는 서비스 레이어입니다.
 * 환경 변수가 없거나 쿼리 실패 시 null을 반환하고, UI는 Zustand 스토어로 폴백합니다.
 */
import { isSupabaseConfigured, supabase, supabaseProjectUrl } from "@/lib/supabase/client";
import type { BusinessCard, CardLink } from "@/types/domain";

const TABLE_CARDS = "business_cards";
const CARD_TABLE_CANDIDATES = ["business_cards", "cards"] as const;
type CardTableName = (typeof CARD_TABLE_CANDIDATES)[number];

export type FetchMyCardsStatus = "ok" | "not_configured" | "error";

export type FetchMyCardsResult = {
  status: FetchMyCardsStatus;
  cards: BusinessCard[];
  error?: string;
  source?: "user_id" | "owner_id" | "email" | "owner_email" | "none";
  table?: CardTableName;
};

/** Supabase `business_cards`에 존재하는 컬럼만 UPSERT (로컬 전용 필드 제외) */
const BUSINESS_CARD_REMOTE_KEYS = [
  "id",
  "user_id",
  "slug",
  "brand_name",
  "person_name",
  "job_title",
  "intro",
  "phone",
  "email",
  "website_url",
  "blog_url",
  "youtube_url",
  "kakao_url",
  "theme",
  "is_public",
  "created_at",
  "expire_at",
  "status",
  "promotion_enabled",
  "promotion_payment_status",
  "promotion_price",
  "tagline",
  "publicUrl",
  "trust_line",
  "gallery_urls",
  "services",
  "imageUrl",
  "brand_image_url",
  "brand_image_frame_ratio",
  "brand_image_natural_width",
  "brand_image_natural_height",
  "brand_image_zoom",
  "brand_image_pan_x",
  "brand_image_pan_y",
  "brand_image_object_position",
] as const satisfies ReadonlyArray<keyof BusinessCard>;

export function pickBusinessCardForRemote(card: BusinessCard): BusinessCard {
  const out = {} as BusinessCard;
  for (const key of BUSINESS_CARD_REMOTE_KEYS) {
    (out as unknown as Record<string, unknown>)[key] = card[key];
  }
  return out;
}
const TABLE_LINKS = "card_links";

function normalizeEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

function isMissingColumnError(errorMessage: string, column: string): boolean {
  const lower = errorMessage.toLowerCase();
  return lower.includes(column.toLowerCase()) && (lower.includes("column") || lower.includes("schema cache"));
}

function isMissingTableError(errorMessage: string, table: string): boolean {
  const lower = errorMessage.toLowerCase();
  return (
    lower.includes(table.toLowerCase()) &&
    (lower.includes("does not exist") || lower.includes("schema cache") || lower.includes("relation"))
  );
}

async function queryCardsByColumn(
  table: CardTableName,
  column: "user_id" | "owner_id" | "email" | "owner_email",
  value: string,
): Promise<{ cards: BusinessCard[] | null; error?: string; missingColumn?: boolean; missingTable?: boolean }> {
  if (!supabase) return { cards: null, error: "Supabase client is not available" };
  const query = supabase.from(table).select("*");
  const filtered =
    column === "email" || column === "owner_email" ? query.ilike(column, value) : query.eq(column, value);
  const { data, error } = await filtered;
  if (error) {
    return {
      cards: null,
      error: error.message,
      missingColumn: isMissingColumnError(error.message, column),
      missingTable: isMissingTableError(error.message, table),
    };
  }
  const cards = [...((data as BusinessCard[]) ?? [])].sort(
    (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime(),
  );
  return { cards };
}

async function attachLegacyCardsToUser(
  table: CardTableName,
  cards: BusinessCard[],
  userId: string,
): Promise<BusinessCard[]> {
  if (!supabase || cards.length === 0) return cards;
  const claimed: BusinessCard[] = [];
  for (const card of cards) {
    if (card.user_id === userId) {
      claimed.push(card);
      continue;
    }
    const next = { ...card, user_id: userId, owner_id: card.owner_id ?? userId };
    const { error } = await supabase.from(table).update({ user_id: userId }).eq("id", card.id);
    if (error) {
      console.warn("[cardsService] attachLegacyCardsToUser", {
        cardId: card.id,
        error: error.message,
      });
      claimed.push(next);
    } else {
      claimed.push(next);
    }
  }
  return claimed;
}

export async function fetchMyCardsForUser(user: { id: string; email?: string | null }): Promise<FetchMyCardsResult> {
  if (!isSupabaseConfigured || !supabase) return { status: "not_configured", cards: [], source: "none" };

  const userId = user.id.trim();
  const email = normalizeEmail(user.email);
  console.info("[cardsService] fetchMyCardsForUser auth", {
    userId,
    email,
    supabaseConfigured: isSupabaseConfigured,
    supabaseProjectUrl,
  });

  const attempts: Array<{ column: "user_id" | "owner_id" | "email" | "owner_email"; value: string }> = [
    { column: "user_id", value: userId },
    { column: "owner_id", value: userId },
  ];
  if (email) {
    attempts.push({ column: "email", value: email });
    attempts.push({ column: "owner_email", value: email });
  }

  let firstError = "";
  for (const table of CARD_TABLE_CANDIDATES) {
    for (const attempt of attempts) {
      const result = await queryCardsByColumn(table, attempt.column, attempt.value);
      if (result.missingTable) {
        console.info("[cardsService] fetchMyCardsForUser skipped missing table", table);
        break;
      }
      if (result.error && !result.missingColumn) {
        firstError ||= result.error;
        console.warn("[cardsService] fetchMyCardsForUser query failed", {
          table,
          column: attempt.column,
          error: result.error,
        });
        continue;
      }
      if (result.missingColumn) {
        console.info("[cardsService] fetchMyCardsForUser skipped missing column", {
          table,
          column: attempt.column,
        });
        continue;
      }
      const cards = result.cards ?? [];
      console.info("[cardsService] fetchMyCardsForUser query result", {
        table,
        column: attempt.column,
        count: cards.length,
        authUserId: userId,
        sampleOwners: cards.slice(0, 5).map((card) => ({
          id: card.id,
          user_id: card.user_id,
          owner_id: card.owner_id ?? null,
          email: card.email ?? null,
          owner_email: card.owner_email ?? null,
        })),
      });
      if (cards.length > 0) {
        const normalized = attempt.column === "user_id" ? cards : await attachLegacyCardsToUser(table, cards, userId);
        return { status: "ok", cards: normalized, source: attempt.column, table };
      }
    }
  }

  if (firstError) return { status: "error", cards: [], error: firstError, source: "none" };
  return { status: "ok", cards: [], source: "none" };
}

export async function fetchMyCards(userId: string): Promise<BusinessCard[] | null> {
  const result = await fetchMyCardsForUser({ id: userId });
  if (result.status !== "ok") return null;
  return result.cards;
}

export async function fetchCardBySlug(slug: string): Promise<BusinessCard | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase
    .from(TABLE_CARDS)
    .select("*")
    .eq("slug", slug)
    .eq("is_public", true)
    .maybeSingle();
  if (error) {
    console.warn("[cardsService] fetchCardBySlug", error.message);
    return null;
  }
  return data as BusinessCard | null;
}

export async function updateCardNameRemote(cardId: string, name: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;

  let updated = false;
  const { error } = await supabase
    .from(TABLE_CARDS)
    .update({ person_name: name, name })
    .eq("id", cardId);
  if (!error) {
    updated = true;
  } else if (error.message.toLowerCase().includes("name")) {
    const retry = await supabase.from(TABLE_CARDS).update({ person_name: name }).eq("id", cardId);
    if (!retry.error) {
      updated = true;
    } else {
      console.warn("[cardsService] updateCardNameRemote retry", retry.error.message);
    }
  } else {
    console.warn("[cardsService] updateCardNameRemote", error.message);
  }

  const legacy = await supabase.from("cards").update({ name }).eq("id", cardId);
  if (!legacy.error) {
    updated = true;
  } else {
    console.warn("[cardsService] updateCardNameRemote legacy cards", legacy.error.message);
  }
  return updated;
}

export async function fetchCardLinks(cardId: string): Promise<CardLink[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase
    .from(TABLE_LINKS)
    .select("*")
    .eq("card_id", cardId)
    .order("sort_order", { ascending: true });
  if (error) {
    console.warn("[cardsService] fetchCardLinks", error.message);
    return null;
  }
  return data as CardLink[];
}

export async function upsertCardRemote(card: BusinessCard): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const { error } = await supabase.from(TABLE_CARDS).upsert(pickBusinessCardForRemote(card));
  if (error) {
    console.warn("[cardsService] upsertCardRemote", error.message);
    return false;
  }
  return true;
}
