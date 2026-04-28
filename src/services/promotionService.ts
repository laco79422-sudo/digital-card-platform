import { normalizeBusinessCardRow } from "@/lib/businessCardRow";
import { buildCardShareUrl } from "@/lib/cardShareUrl";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import type { BusinessCard, PromotionApplication } from "@/types/domain";

const TABLE_CARDS = "business_cards";
const TABLE_PROMOTION_APPLICATIONS = "promotion_applications";
export const PROMOTION_LINK_PRICE = 10900;

export async function startPromotionLinkPayment(cardId: string): Promise<{ ok: boolean; cardId: string }> {
  // Toss Payments 연결 시 이 함수에서 결제창을 시작합니다.
  return { ok: true, cardId };
}

export async function handlePromotionLinkPaymentSuccess(cardId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const { error } = await supabase
    .from(TABLE_CARDS)
    .update({
      promotion_enabled: true,
      promotion_payment_status: "paid",
      promotion_price: PROMOTION_LINK_PRICE,
    })
    .eq("id", cardId);
  if (error) {
    console.warn("[promotionService] handlePromotionLinkPaymentSuccess", error.message);
    return false;
  }
  return true;
}

export async function fetchPromotionEnabledCards(): Promise<BusinessCard[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase
    .from(TABLE_CARDS)
    .select("*")
    .eq("promotion_enabled", true)
    .eq("is_public", true)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[promotionService] fetchPromotionEnabledCards", error.message, error);
    return null;
  }
  const rows = (data as Record<string, unknown>[]) ?? [];
  return rows.map((r) => normalizeBusinessCardRow(r));
}

export function buildPromoterCode(cardId: string, userId: string): string {
  return `PROMO${cardId.slice(0, 4)}${userId.slice(0, 6)}${Date.now().toString(36)}`.replace(/[^A-Z0-9]/gi, "").toUpperCase();
}

export function buildPromotionUrl(origin: string, slug: string, promoterCode: string): string {
  const base = buildCardShareUrl(origin, slug) ?? `${origin}/c/${encodeURIComponent(slug)}`;
  const url = new URL(base);
  url.searchParams.set("ref", promoterCode);
  return url.toString();
}

export async function createPromotionApplicationRemote(
  application: PromotionApplication,
): Promise<PromotionApplication | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { card_name: _cardName, card_slug: _cardSlug, ...remote } = application;
  const { data, error } = await supabase.from(TABLE_PROMOTION_APPLICATIONS).insert(remote).select("*").single();
  if (error) {
    console.warn("[promotionService] createPromotionApplicationRemote", error.message);
    return null;
  }
  return data as PromotionApplication;
}

export async function fetchPromotionApplicationsForOwner(ownerUserId: string): Promise<PromotionApplication[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase
    .from(TABLE_PROMOTION_APPLICATIONS)
    .select("*")
    .eq("owner_user_id", ownerUserId)
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("[promotionService] fetchPromotionApplicationsForOwner", error.message);
    return null;
  }
  return data as PromotionApplication[];
}

export async function fetchPromotionApplicationsForApplicant(applicantUserId: string): Promise<PromotionApplication[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase
    .from(TABLE_PROMOTION_APPLICATIONS)
    .select("*")
    .eq("applicant_user_id", applicantUserId)
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("[promotionService] fetchPromotionApplicationsForApplicant", error.message);
    return null;
  }
  return data as PromotionApplication[];
}

export async function updatePromotionApplicationRemote(
  id: string,
  patch: Partial<PromotionApplication>,
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const { card_name: _cardName, card_slug: _cardSlug, ...remote } = patch;
  const { error } = await supabase.from(TABLE_PROMOTION_APPLICATIONS).update(remote).eq("id", id);
  if (error) {
    console.warn("[promotionService] updatePromotionApplicationRemote", error.message);
    return false;
  }
  return true;
}
