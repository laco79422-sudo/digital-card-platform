import { useAuthHydration } from "@/hooks/useAuthHydration";
import { useAuthStore } from "@/stores/authStore";

/** persist 복원 + Supabase 초기 세션 확인이 끝난 뒤에만 라우팅·폼을 신뢰할 수 있습니다. */
export function useAuthReady(): boolean {
  const hydrated = useAuthHydration();
  const authLoading = useAuthStore((s) => s.authLoading);
  return hydrated && !authLoading;
}
