import type { User, UserRole } from "@/types/domain";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { SAMPLE_USERS } from "@/data/sampleData";

interface AuthState {
  user: User | null;
  /** true when using built-in demo login (no Supabase session) */
  mockSession: boolean;
  setUser: (user: User | null) => void;
  setMockSession: (v: boolean) => void;
  loginDemo: (role: UserRole) => void;
  logout: () => void;
}

function pickDemoUser(role: UserRole): User {
  if (role === "admin") {
    const u = SAMPLE_USERS.find((x) => x.role === "admin");
    return u ?? SAMPLE_USERS[0];
  }
  if (role === "creator") {
    const u = SAMPLE_USERS.find((x) => x.id === "user-creator-1");
    return u ?? SAMPLE_USERS[1];
  }
  const u = SAMPLE_USERS.find((x) => x.role === "client");
  return u ?? SAMPLE_USERS[0];
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      mockSession: false,
      setUser: (user) => set({ user }),
      setMockSession: (mockSession) => set({ mockSession }),
      loginDemo: (role) =>
        set({
          user: pickDemoUser(role),
          mockSession: true,
        }),
      logout: () => set({ user: null, mockSession: false }),
    }),
    {
      name: "bcc-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user, mockSession: s.mockSession }),
    },
  ),
);
