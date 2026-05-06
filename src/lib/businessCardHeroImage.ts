import { isBrandImagePublicHeroBlocked } from "@/lib/brandImageStatus";
import type { BusinessCard } from "@/types/domain";

/** 내 공간·공개 명함·목록 썸네일 공통 — 빈 값일 때 동일 자산 사용 */
export const CARD_HERO_FALLBACK_SRC = "/og-card-default.png" as const;

function isHeroModerationHidden(card: BusinessCard): boolean {
  return isBrandImagePublicHeroBlocked(card.brand_image_status ?? card.image_status);
}

/**
 * Hero 표시용 공개 URL — 내 공간 미리보기와 /c/:slug 가 동일 우선순위를 씁니다.
 * (DB 스네이크·레거시 카멜 모두 반영)
 * pending/rejected 이면 사용자 업로드 URL을 쓰지 않고 업종 기본·OG·썸네일만 고려합니다.
 */
export function getCardHeroImageUrl(card: BusinessCard, override?: string | null): string {
  const o = override?.trim();
  if (o) return o;
  if (isHeroModerationHidden(card)) {
    return (
      card.og_image_url?.trim() ||
      card.auto_image_url?.trim() ||
      card.thumbnail_url?.trim() ||
      ""
    );
  }
  return (
    card.image_url?.trim() ||
    card.profile_image_url?.trim() ||
    card.og_image_url?.trim() ||
    card.thumbnail_url?.trim() ||
    card.imageUrl?.trim() ||
    card.brand_image_url?.trim() ||
    ""
  );
}

/** 카드만 있으면 항상 표시 가능한 URL (고객·내 공간 목록용 — 기본 이미지까지 포함) */
export function resolveCardHeroDisplayUrl(card: BusinessCard, override?: string | null): string {
  return getCardHeroImageUrl(card, override) || CARD_HERO_FALLBACK_SRC;
}
