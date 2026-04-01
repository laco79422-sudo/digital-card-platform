import {
  clearLastActivity,
  readLastActivityMs,
  writeActivityTimestamp,
} from "@/lib/auth/activityStorage";
import {
  INACTIVITY_LOGOUT_MESSAGE,
  INACTIVITY_NOTICE_SESSION_KEY,
  INACTIVITY_TIMEOUT_MS,
} from "@/lib/auth/inactivityConstants";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { mapSupabaseUser } from "@/lib/supabase/mapAuthUser";
import { useAuthStore } from "@/stores/authStore";
import type { Session } from "@supabase/supabase-js";
import { useEffect } from "react";

/**
 * Supabase Auth 세션을 Zustand와 동기화합니다.
 * 비활성 시간이 `INACTIVITY_TIMEOUT_MS`를 넘기면 세션을 끊고 로그인 화면 안내용 플래그를 남깁니다.
 */
export function useSupabaseAuthSync() {
  const setUser = useAuthStore((s) => s.setUser);
  const setSession = useAuthStore((s) => s.setSession);
  const setAuthLoading = useAuthStore((s) => s.setAuthLoading);
  const setLastActivityAt = useAuthStore((s) => s.setLastActivityAt);

  useEffect(() => {
    if (import.meta.env.VITE_USE_MOCK_AUTH === "true") {
      setAuthLoading(false);
      return;
    }
    if (!isSupabaseConfigured || !supabase) {
      setAuthLoading(false);
      return;
    }

    const client = supabase;

    const applySessionOrClear = async (session: Session | null) => {
      if (session?.user) {
        const last = readLastActivityMs();
        const now = Date.now();
        if (last != null && now - last > INACTIVITY_TIMEOUT_MS) {
          sessionStorage.setItem(INACTIVITY_NOTICE_SESSION_KEY, INACTIVITY_LOGOUT_MESSAGE);
          await client.auth.signOut();
          setUser(null);
          setSession(null);
          setLastActivityAt(null);
          clearLastActivity();
          setAuthLoading(false);
          return;
        }
        if (last == null) {
          writeActivityTimestamp(now);
        }
        setUser(mapSupabaseUser(session.user));
        setSession(session);
        setLastActivityAt(readLastActivityMs());
      } else {
        setUser(null);
        setSession(null);
        setLastActivityAt(null);
        clearLastActivity();
      }
      setAuthLoading(false);
    };

    /** 모바일 등에서 저장소 복원 직후 세션을 확실히 읽기 위해 `getSession`으로 한 번 부트스트랩합니다. */
    void (async () => {
      try {
        const {
          data: { session },
        } = await client.auth.getSession();
        await applySessionOrClear(session);
      } catch {
        setAuthLoading(false);
      }
    })();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      void applySessionOrClear(session);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setSession, setAuthLoading, setLastActivityAt]);
}
