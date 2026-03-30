import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { mapSupabaseUser } from "@/lib/supabase/mapAuthUser";
import { useAuthStore } from "@/stores/authStore";
import { useEffect } from "react";

/**
 * Supabase Auth 세션을 Zustand와 동기화합니다.
 * `getUser()`로 서버 측 사용자를 확인해, persist에 남은 데모 사용자를 덮어씁니다.
 */
export function useSupabaseAuthSync() {
  const setUser = useAuthStore((s) => s.setUser);
  const setMockSession = useAuthStore((s) => s.setMockSession);
  const mockSession = useAuthStore((s) => s.mockSession);

  useEffect(() => {
    if (import.meta.env.VITE_USE_MOCK_AUTH === "true") return;
    if (!isSupabaseConfigured || !supabase || mockSession) return;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(mapSupabaseUser(user));
        setMockSession(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
        setMockSession(false);
      } else if (!useAuthStore.getState().mockSession) {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [mockSession, setMockSession, setUser]);
}
