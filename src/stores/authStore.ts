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
  /** 로컬 데모 전용. `overrides`로 회원가입 폼 이름·이메일을 반영할 수 있습니다. */
  loginDemo: (role: UserRole, overrides?: Partial<Pick<User, "name" | "email">>) => void;
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
      loginDemo: (role, overrides) => {
        const base = pickDemoUser(role);
        set({
          user: { ...base, ...overrides },
          mockSession: true,
        });
      },
      logout: () => {
        set({ user: null, mockSession: false });
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
      partialize: (s) => ({ user: s.user, mockSession: s.mockSession }),
    },
  ),
);
