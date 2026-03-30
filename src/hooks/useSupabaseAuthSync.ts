import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import type { User, UserRole } from "@/types/domain";
import { useEffect } from "react";

function mapSupabaseUser(sessionUser: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): User {
  const meta = sessionUser.user_metadata ?? {};
  const role = (meta.role as UserRole) ?? "client";
  const name = (meta.name as string) ?? sessionUser.email?.split("@")[0] ?? "사용자";
  return {
    id: sessionUser.id,
    role,
    name,
    email: sessionUser.email ?? "",
    phone: (meta.phone as string) ?? null,
    avatar_url: (meta.avatar_url as string) ?? null,
    created_at: new Date().toISOString(),
  };
}

/**
 * Supabase Auth 세션을 Zustand와 동기화합니다.
 * Google OAuth 등은 대시보드에서 동일 훅으로 확장하면 됩니다.
 */
export function useSupabaseAuthSync() {
  const setUser = useAuthStore((s) => s.setUser);
  const setMockSession = useAuthStore((s) => s.setMockSession);
  const mockSession = useAuthStore((s) => s.mockSession);

  useEffect(() => {
    if (import.meta.env.VITE_USE_MOCK_AUTH === "true") return;
    if (!isSupabaseConfigured || !supabase || mockSession) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
        setMockSession(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
        setMockSession(false);
      } else if (!mockSession) {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [mockSession, setMockSession, setUser]);
}
