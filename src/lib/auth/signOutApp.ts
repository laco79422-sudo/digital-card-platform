import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/authStore";

/** Supabase 세션 종료 후 Zustand·persist·마지막 활동 시각을 정리합니다. */
export async function signOutApp() {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut();
  }
  useAuthStore.getState().logout();
}
