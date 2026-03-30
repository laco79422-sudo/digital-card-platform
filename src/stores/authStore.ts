import type { User } from "@/types/domain";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => {
        set({ user: null });
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
