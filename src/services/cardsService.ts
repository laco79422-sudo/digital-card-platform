/**
 * Supabase 테이블(business_cards, card_links 등)과 연동할 때 사용하는 서비스 레이어입니다.
 * 환경 변수가 없거나 쿼리 실패 시 null을 반환하고, UI는 Zustand 스토어로 폴백합니다.
 */
import { normalizeBusinessCardRow } from "@/lib/businessCardRow";
import { normalizeSlugLookup } from "@/lib/publicCardSlug";
import { isSupabaseConfigured, supabase, supabaseProjectUrl } from "@/lib/supabase/client";
import type { BusinessCard, CardLink } from "@/types/domain";

const TABLE_CARDS = "business_cards";

export type FetchMyCardsStatus = "ok" | "not_configured" | "error";

export type FetchMyCardsResult = {
  status: FetchMyCardsStatus;
  cards: BusinessCard[];
  error?: string;
  source?: "user_id" | "owner_id" | "email" | "owner_email" | "none";
  table?: typeof TABLE_CARDS;
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
  "kakao_chat_url",
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
  "image_url",
  "profile_image_url",
  "thumbnail_url",
  "imageUrl",
  "brand_image_url",
  "brand_image_frame_ratio",
  "brand_image_natural_width",
  "brand_image_natural_height",
  "brand_image_zoom",
  "brand_image_pan_x",
  "brand_image_pan_y",
  "brand_image_object_position",
  "qr_image_url",
  "design_type",
  "og_image_url",
  "industry",
  "auto_image_url",
] as const satisfies ReadonlyArray<keyof BusinessCard>;

export function pickBusinessCardForRemote(card: BusinessCard): BusinessCard {
  const out = {} as BusinessCard;
  for (const key of BUSINESS_CARD_REMOTE_KEYS) {
    (out as unknown as Record<string, unknown>)[key] = card[key];
  }
  return out;
}

/** PostgREST UPSERT용 — 스네이크 컬럼(image_url 등)과 레거시 카멜 동시 기록 */
export function businessCardToRemoteRow(card: BusinessCard): Record<string, unknown> {
  const picked = pickBusinessCardForRemote(card);
  const hero =
    card.image_url?.trim() ||
    card.profile_image_url?.trim() ||
    picked.imageUrl?.trim() ||
    picked.brand_image_url?.trim() ||
    null;

  return {
    ...picked,
    image_url: hero ?? card.image_url ?? null,
    profile_image_url: card.profile_image_url ?? null,
    imageUrl: hero ?? picked.imageUrl ?? null,
    brand_image_url: picked.brand_image_url ?? hero ?? null,
    name: picked.person_name ?? null,
    title: picked.job_title ?? null,
    company: picked.brand_name ?? null,
    description: picked.intro ?? null,
  };
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
  const t = table.toLowerCase();
  if (!lower.includes(t)) return false;
  return (
    lower.includes("does not exist") ||
    lower.includes("schema cache") ||
    lower.includes("could not find")
  );
}

async function queryCardsByColumn(
  table: typeof TABLE_CARDS,
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
  const cards = [...((data as Record<string, unknown>[]) ?? [])]
    .map((row) => normalizeBusinessCardRow(row))
    .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime());
  return { cards };
}

async function attachLegacyCardsToUser(
  table: typeof TABLE_CARDS,
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
  const table = TABLE_CARDS;
  for (const attempt of attempts) {
    const result = await queryCardsByColumn(table, attempt.column, attempt.value);
    if (result.missingTable) {
      console.error("[cardsService] fetchMyCardsForUser missing relation", table, result.error);
      return { status: "ok", cards: [], source: "none", table };
    }
    if (result.error && !result.missingColumn) {
      firstError ||= result.error;
      console.error("[cardsService] fetchMyCardsForUser query failed", {
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
      const normalized =
        attempt.column === "user_id" ? cards : await attachLegacyCardsToUser(table, cards, userId);
      return { status: "ok", cards: normalized, source: attempt.column, table };
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

export type FetchCardBySlugResult = {
  card: BusinessCard | null;
  errorMessage: string | null;
  /** 조회에 사용한 테이블 (실패 시 마지막 시도) */
  sourceTable: "business_cards" | "cards";
};

/** 공개 명함 slug 조회 — `business_cards` 우선, 레거시 `cards` 테이블은 선택적 폴백 */
export async function fetchCardBySlug(slug: string): Promise<FetchCardBySlugResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { card: null, errorMessage: "Supabase 미설정", sourceTable: "business_cards" };
  }
  const trimmed = slug.trim();
  if (!trimmed) {
    return { card: null, errorMessage: "빈 slug", sourceTable: "business_cards" };
  }

  const variants = Array.from(
    new Set([normalizeSlugLookup(trimmed), trimmed].filter((x) => x.length > 0)),
  );

  let lastError: string | null = null;

  try {
    for (const v of variants) {
      const { data, error } = await supabase
        .from(TABLE_CARDS)
        .select("*")
        .eq("slug", v)
        .eq("is_public", true)
        .maybeSingle();
      if (error) {
        if (!isMissingTableError(error.message, TABLE_CARDS)) {
          lastError = error.message;
          console.error("[cardsService] fetchCardBySlug business_cards", v, error.message, error);
        }
        continue;
      }
      if (data) {
        return {
          card: normalizeBusinessCardRow(data as Record<string, unknown>),
          errorMessage: null,
          sourceTable: "business_cards",
        };
      }
    }

    for (const v of variants) {
      const { data, error } = await supabase
        .from("cards")
        .select("*")
        .eq("slug", v)
        .eq("is_public", true)
        .maybeSingle();
      if (error) {
        const msg = error.message || "";
        if (
          msg.includes("cards") &&
          (msg.includes("does not exist") || msg.includes("schema cache") || msg.includes("Could not find"))
        ) {
          break;
        }
        lastError = msg;
        console.warn("[cardsService] fetchCardBySlug cards fallback", v, msg);
        continue;
      }
      if (data) {
        return {
          card: normalizeBusinessCardRow(data as Record<string, unknown>),
          errorMessage: null,
          sourceTable: "cards",
        };
      }
    }

    return {
      card: null,
      errorMessage: lastError ?? "일치하는 공개 명함 없음",
      sourceTable: "business_cards",
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[cardsService] fetchCardBySlug unexpected", e);
    return { card: null, errorMessage: msg, sourceTable: "business_cards" };
  }
}

function cardBelongsToRemoteEditorUser(card: BusinessCard, user: { id: string; email?: string | null }): boolean {
  const email = (user.email ?? "").trim().toLowerCase();
  return (
    card.user_id === user.id ||
    card.owner_id === user.id ||
    Boolean(email && (card.owner_email?.trim().toLowerCase() === email || card.email?.trim().toLowerCase() === email))
  );
}

/** 편집기 직접 진입 시 스토어에 카드가 없을 때 Supabase에서 단건 조회 */
export async function fetchBusinessCardByIdForOwner(
  cardId: string,
  user: { id: string; email?: string | null },
): Promise<{ card: BusinessCard | null; error: string | null }> {
  if (!isSupabaseConfigured || !supabase) return { card: null, error: null };
  const trimmed = cardId.trim();
  if (!trimmed) return { card: null, error: "invalid_id" };
  const { data, error } = await supabase.from(TABLE_CARDS).select("*").eq("id", trimmed).maybeSingle();
  if (error) {
    console.error("[cardsService] fetchBusinessCardByIdForOwner", error.message);
    return { card: null, error: error.message };
  }
  if (!data) return { card: null, error: "not_found" };
  const card = normalizeBusinessCardRow(data as Record<string, unknown>);
  if (!cardBelongsToRemoteEditorUser(card, user)) return { card: null, error: "forbidden" };
  return { card, error: null };
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

export async function patchCardBrandHeroRemote(
  cardId: string,
  patch: Partial<
    Pick<
      BusinessCard,
      | "imageUrl"
      | "brand_image_url"
      | "image_url"
      | "profile_image_url"
      | "brand_image_natural_width"
      | "brand_image_natural_height"
      | "brand_image_zoom"
      | "brand_image_pan_x"
      | "brand_image_pan_y"
      | "brand_image_object_position"
    >
  >,
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase || !cardId.trim()) return false;
  const row: Record<string, unknown> = {};
  const keys = [
    "imageUrl",
    "brand_image_url",
    "image_url",
    "profile_image_url",
    "brand_image_natural_width",
    "brand_image_natural_height",
    "brand_image_zoom",
    "brand_image_pan_x",
    "brand_image_pan_y",
    "brand_image_object_position",
  ] as const;
  for (const key of keys) {
    if (patch[key] !== undefined) row[key] = patch[key];
  }
  const hero =
    patch.image_url ?? patch.imageUrl ?? patch.brand_image_url ?? undefined;
  if (hero !== undefined && hero !== null) {
    row.image_url = hero;
    row.imageUrl = hero;
    if (patch.brand_image_url === undefined) row.brand_image_url = hero;
  }
  if (Object.keys(row).length === 0) return true;
  const { error } = await supabase.from(TABLE_CARDS).update(row).eq("id", cardId);
  if (error) {
    console.error("[cardsService] patchCardBrandHeroRemote", error.message, error);
    return false;
  }
  return true;
}

export async function upsertCardRemote(card: BusinessCard): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const { error } = await supabase.from(TABLE_CARDS).upsert(businessCardToRemoteRow(card));
  if (error) {
    console.error("[cardsService] upsertCardRemote", error.message, error);
    return false;
  }
  return true;
}
