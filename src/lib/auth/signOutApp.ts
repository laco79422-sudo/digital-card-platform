import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/authStore";

/** Supabase 세션 종료 후 Zustand·linko-auth persist 정리 */
export async function signOutApp() {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut();
  }
  useAuthStore.getState().logout();
}
