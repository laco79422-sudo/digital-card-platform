import {
  INACTIVITY_LOGOUT_MESSAGE,
  INACTIVITY_NOTICE_SESSION_KEY,
  INACTIVITY_TIMEOUT_MS,
} from "@/lib/auth/inactivityConstants";
import { readLastActivityMs } from "@/lib/auth/activityStorage";
import { signOutApp } from "@/lib/auth/signOutApp";
import { useAuthStore } from "@/stores/authStore";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

/** `scroll`은 캡처 단계로 등록해 내부 스크롤 영역에서도 갱신되게 합니다. */
const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart"] as const;
const MOUSE_MOVE_THROTTLE_MS = 1000;
/** 탭 백그라운드 등으로 setTimeout이 지연될 때를 대비한 주기적 점검 (ms) */
const INACTIVITY_POLL_MS = 60_000;

/**
 * 로그인 중일 때만 사용자 활동을 추적하고, `INACTIVITY_TIMEOUT_MS` 동안 활동이 없으면
 * Supabase 로그아웃 후 로그인 페이지로 이동합니다.
 */
export function useInactivityLogout() {
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const touchActivity = useAuthStore((s) => s.touchActivity);
  const navigate = useNavigate();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logoutOnceRef = useRef(false);

  useEffect(() => {
    if (!user || !session) return;
    logoutOnceRef.current = false;

    const runInactivityLogout = () => {
      if (logoutOnceRef.current) return;
      logoutOnceRef.current = true;
      sessionStorage.setItem(INACTIVITY_NOTICE_SESSION_KEY, INACTIVITY_LOGOUT_MESSAGE);
      void signOutApp().then(() => {
        navigate("/login", { replace: true });
      });
    };

    const scheduleTimeout = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      const last = readLastActivityMs() ?? Date.now();
      const elapsed = Date.now() - last;
      const remaining = INACTIVITY_TIMEOUT_MS - elapsed;
      if (remaining <= 0) {
        runInactivityLogout();
        return;
      }
      timeoutRef.current = setTimeout(() => {
        const l = readLastActivityMs();
        if (!l || Date.now() - l >= INACTIVITY_TIMEOUT_MS) {
          runInactivityLogout();
        } else {
          scheduleTimeout();
        }
      }, remaining);
    };

    scheduleTimeout();

    let lastMove = 0;
    const bump = () => {
      touchActivity();
      scheduleTimeout();
    };

    const onMouseMove = () => {
      const now = Date.now();
      if (now - lastMove < MOUSE_MOVE_THROTTLE_MS) return;
      lastMove = now;
      bump();
    };

    for (const ev of ACTIVITY_EVENTS) {
      window.addEventListener(ev, bump, { passive: true });
    }
    document.addEventListener("scroll", bump, { passive: true, capture: true });
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    intervalRef.current = setInterval(() => {
      const last = readLastActivityMs();
      if (!last || Date.now() - last >= INACTIVITY_TIMEOUT_MS) {
        runInactivityLogout();
      }
    }, INACTIVITY_POLL_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      for (const ev of ACTIVITY_EVENTS) {
        window.removeEventListener(ev, bump);
      }
      document.removeEventListener("scroll", bump, { capture: true });
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [user, session, touchActivity, navigate]);
}
