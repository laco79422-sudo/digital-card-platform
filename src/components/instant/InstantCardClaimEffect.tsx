import { INSTANT_GUEST_USER_ID } from "@/lib/instantCardCreate";
import { clearInstantCardId, peekInstantCardId } from "@/lib/instantCardStorage";
import { useAuthStore } from "@/stores/authStore";
import { useAppDataStore } from "@/stores/appDataStore";
import { useEffect } from "react";

/**
 * OAuth 등 세션이 복구된 뒤 게스트 즉시 명함 소유권 이전.
 * 이메일 로그인/가입은 해당 페이지에서 동기 처리합니다.
 */
export function InstantCardClaimEffect() {
  const user = useAuthStore((s) => s.user);
  const claimInstantGuestCard = useAppDataStore((s) => s.claimInstantGuestCard);
  const businessCards = useAppDataStore((s) => s.businessCards);

  useEffect(() => {
    if (!user) return;
    const cardId = peekInstantCardId();
    if (!cardId) return;
    const card = businessCards.find((c) => c.id === cardId);
    if (!card) return;
    if (card.user_id !== INSTANT_GUEST_USER_ID) {
      clearInstantCardId();
      return;
    }
    claimInstantGuestCard(user.id, cardId);
    clearInstantCardId();
  }, [user, claimInstantGuestCard, businessCards]);

  return null;
}
