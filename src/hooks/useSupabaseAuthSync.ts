import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { mapSupabaseUser } from "@/lib/supabase/mapAuthUser";
import { useAuthStore } from "@/stores/authStore";
import { useEffect } from "react";

/**
 * Supabase Auth 세션을 Zustand와 동기화합니다.
 * 세션이 없으면 `user`를 비워 로컬 persist와 실제 로그인 상태를 맞춥니다.
 */
export function useSupabaseAuthSync() {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    if (import.meta.env.VITE_USE_MOCK_AUTH === "true") return;
    if (!isSupabaseConfigured || !supabase) return;

    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error) return;
      if (user) setUser(mapSupabaseUser(user));
      else setUser(null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) setUser(mapSupabaseUser(session.user));
      else setUser(null);
    });

    return () => subscription.unsubscribe();
  }, [setUser]);
}
