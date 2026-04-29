import { resolveCardHeroDisplayUrl } from "@/lib/businessCardHeroImage";
import type { BusinessCard } from "@/types/domain";

type Props = {
  card: BusinessCard;
  className?: string;
  loading?: "lazy" | "eager";
};

/** 내 공간·목록 썸네일 — 공개 명함 히어로와 동일 우선순위·동일 폴백 (`/og-card-default.png`) */
export function CardHeroThumbnailImg({ card, className, loading = "lazy" }: Props) {
  return <img src={resolveCardHeroDisplayUrl(card)} alt="" className={className} loading={loading} />;
}
