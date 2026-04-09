/**
 * Supabase 테이블(business_cards, card_links 등)과 연동할 때 사용하는 서비스 레이어입니다.
 * 환경 변수가 없거나 쿼리 실패 시 null을 반환하고, UI는 Zustand 스토어로 폴백합니다.
 */
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import type { BusinessCard, CardLink } from "@/types/domain";

const TABLE_CARDS = "business_cards";

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
  "tagline",
  "trust_line",
  "gallery_urls",
  "services",
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

export async function fetchMyCards(userId: string): Promise<BusinessCard[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase
    .from(TABLE_CARDS)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("[cardsService] fetchMyCards", error.message);
    return null;
  }
  return data as BusinessCard[];
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
