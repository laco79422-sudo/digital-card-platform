import { useAuthReady } from "@/hooks/useAuthReady";
import { isEmailConfirmed } from "@/lib/auth/authActions";
import { peekPendingCardDraft } from "@/lib/pendingCardStorage";
import {
  SHOW_PENDING_CARD_SAVED_STATE,
  tryFlushPendingCardDraftForAuthenticatedUser,
} from "@/services/pendingCardDraftFlush";
import { useAuthStore } from "@/stores/authStore";
import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/** OAuth·페이지 새로 고침 뒤: 세션에 남아 있는 명함 초안을 자동 저장하고 내 공간으로 연결합니다. */
export function PendingCardDraftFlushEffect() {
  const authReady = useAuthReady();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const pathname = useLocation().pathname;
  const flushing = useRef(false);

  useEffect(() => {
    if (!authReady || !user?.id || !isEmailConfirmed({ email_confirmed_at: user.email_confirmed_at ?? undefined }))
      return;
    if (!peekPendingCardDraft()) return;

    let cancelled = false;

    void (async () => {
      if (flushing.current) return;
      flushing.current = true;
      try {
        const result = await tryFlushPendingCardDraftForAuthenticatedUser(user);
        if (cancelled || !result.saved) return;

        const statePayload = { [SHOW_PENDING_CARD_SAVED_STATE]: true as const };

        if (pathname.startsWith("/dashboard")) {
          navigate(".", { replace: true, state: statePayload });
        } else {
          navigate("/dashboard", {
            replace: pathname === "/signup" || pathname === "/login" || pathname === "/auth/callback" || pathname === "/",
            state: statePayload,
          });
        }
      } finally {
        flushing.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authReady, user, navigate, pathname]);

  return null;
}
