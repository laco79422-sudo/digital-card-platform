import { useAuthReady } from "@/hooks/useAuthReady";
import { isEmailConfirmed } from "@/lib/auth/authActions";
import {
  peekPendingCardDraft,
  peekPendingDeferAutoFlush,
  peekPendingHeroResumeAfterAuth,
} from "@/lib/pendingCardStorage";
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

    /** 이미지 이어등록 플로우: 자동 플러시 안 함 · 로그인 직후 랜딩에서만 편집기로 안내합니다. */
    if (peekPendingHeroResumeAfterAuth() && peekPendingCardDraft()) {
      const funnel =
        pathname === "/" ||
        pathname === "/login" ||
        pathname === "/signup" ||
        pathname === "/auth/callback";
      if (funnel) {
        navigate("/cards/new", { replace: true });
      }
      return;
    }

    /** 로그인 직후: 자동 DB 저장 안 함 초안(defer) — 편집기에서 이어 작성 */
    if (peekPendingDeferAutoFlush() && peekPendingCardDraft()) {
      const funnel =
        pathname === "/" ||
        pathname === "/login" ||
        pathname === "/signup" ||
        pathname === "/auth/callback";
      if (funnel) {
        navigate("/cards/new", { replace: true });
      }
      return;
    }

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
