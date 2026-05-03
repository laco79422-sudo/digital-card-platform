import type { BusinessCard, User } from "@/types/domain";

/** 내 공간·대시보드·편집기에서 명함 소유 여부 통일 판별 */
export function businessCardOwnedByUser(card: BusinessCard, user: User | null | undefined): boolean {
  if (!user?.id) return false;
  const email = user.email.trim().toLowerCase();
  return (
    card.user_id === user.id ||
    card.owner_id === user.id ||
    Boolean(email && (card.owner_email?.trim().toLowerCase() === email || card.email?.trim().toLowerCase() === email))
  );
}
