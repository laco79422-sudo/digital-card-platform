import type { User } from "@/types/domain";
import { clearLastActivity, writeActivityTimestamp } from "@/lib/auth/activityStorage";
import type { Session } from "@supabase/supabase-js";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AuthState {
  user: User | null;
  session: Session | null;
  authLoading: boolean;
  lastActivityAt: number | null;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setLastActivityAt: (at: number | null) => void;
  touchActivity: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      authLoading: true,
      lastActivityAt: null,
      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setAuthLoading: (authLoading) => set({ authLoading }),
      setLastActivityAt: (lastActivityAt) => set({ lastActivityAt }),
      touchActivity: () => {
        const now = Date.now();
        writeActivityTimestamp(now);
        set({ lastActivityAt: now });
      },
      logout: () => {
        clearLastActivity();
        set({ user: null, session: null, lastActivityAt: null });
        try {
          localStorage.removeItem("linko-auth");
          localStorage.removeItem("bcc-auth");
        } catch {
          /* ignore */
        }
      },
    }),
    {
      name: "linko-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user }),
    },
  ),
);
