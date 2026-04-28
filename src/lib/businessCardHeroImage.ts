import type { BusinessCard } from "@/types/domain";

/** Hero 표시용 공개 URL — DB 스네이크·레거시 카멜 모두 반영 */
export function getCardHeroImageUrl(card: BusinessCard, override?: string | null): string {
  const o = override?.trim();
  if (o) return o;
  return (
    card.og_image_url?.trim() ||
    card.image_url?.trim() ||
    card.profile_image_url?.trim() ||
    card.imageUrl?.trim() ||
    card.brand_image_url?.trim() ||
    ""
  );
}
