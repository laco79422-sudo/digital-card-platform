import type { BusinessCard } from "@/types/domain";
import { normalizePreviewCardType } from "@/lib/previewCardType";
import { parseCardIndustryPayload } from "@/types/cardIndustry";

function optStr(v: unknown): string | null {
  if (v == null) return null;
  const s = typeof v === "string" ? v.trim() : String(v).trim();
  return s || null;
}

/**
 * Supabase PostgREST 행 → 앱 BusinessCard.
 * image_url / profile_image_url 우선, 레거시 imageUrl·brand_image_url과 병합.
 */
export function normalizeBusinessCardRow(raw: Record<string, unknown>): BusinessCard {
  const base = { ...(raw as unknown as BusinessCard) };
  const image_url = optStr(raw.image_url);
  const profile_image_url = optStr(raw.profile_image_url);
  const imageUrlQuoted = optStr(raw.imageUrl);
  const brand_image_url = optStr(raw.brand_image_url);

  const mergedHero =
    image_url ||
    profile_image_url ||
    imageUrlQuoted ||
    brand_image_url ||
    optStr(raw.thumbnail_url) ||
    null;

  const og_image_url = optStr(raw.og_image_url);
  const industry = optStr(raw.industry);
  const auto_image_url = optStr(raw.auto_image_url);
  const thumbnail_url = optStr(raw.thumbnail_url);
  const brand_image_status = optStr(raw.brand_image_status) as BusinessCard["brand_image_status"];
  const brand_image_pending_path = optStr(raw.brand_image_pending_path);
  const brand_image_reject_reason = optStr(raw.brand_image_reject_reason);
  const brand_image_pending_uploaded_at = optStr(raw.brand_image_pending_uploaded_at);

  const person_name =
    optStr(raw.person_name) ?? optStr(raw.name) ?? base.person_name ?? "";
  const brand_name = optStr(raw.brand_name) ?? optStr(raw.company) ?? base.brand_name ?? "";
  const job_title = optStr(raw.job_title) ?? optStr(raw.title) ?? base.job_title ?? "";
  const intro = optStr(raw.intro) ?? optStr(raw.description) ?? base.intro ?? "";
  const marketing_title = optStr(raw.marketing_title) ?? optStr(base.marketing_title) ?? null;
  const address = optStr(raw.address) ?? optStr(base.address) ?? null;
  const preview_card_type_raw = optStr(raw.preview_card_type) ?? optStr(base.preview_card_type) ?? null;

  return {
    ...base,
    person_name,
    brand_name,
    job_title,
    intro,
    marketing_title,
    address,
    preview_card_type: preview_card_type_raw ? normalizePreviewCardType(preview_card_type_raw) : null,
    image_url: image_url ?? undefined,
    profile_image_url: profile_image_url ?? undefined,
    og_image_url: og_image_url ?? undefined,
    industry: industry ?? undefined,
    card_industry: parseCardIndustryPayload(raw.card_industry ?? null) ?? undefined,
    auto_image_url: auto_image_url ?? undefined,
    thumbnail_url: thumbnail_url ?? undefined,
    imageUrl: mergedHero ?? base.imageUrl ?? null,
    brand_image_url: mergedHero ?? brand_image_url ?? base.brand_image_url ?? null,
    brand_image_status:
      brand_image_status === "pending" || brand_image_status === "approved" || brand_image_status === "rejected"
        ? brand_image_status
        : undefined,
    brand_image_pending_path: brand_image_pending_path ?? undefined,
    brand_image_reject_reason: brand_image_reject_reason ?? undefined,
    brand_image_pending_uploaded_at: brand_image_pending_uploaded_at ?? undefined,
  };
}
