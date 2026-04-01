import { useAuthStore } from "@/stores/authStore";
import { useEffect, useState } from "react";

/** `persist` 복원이 끝난 뒤에만 `user` 유무를 신뢰할 수 있게 합니다. */
export function useAuthHydration(): boolean {
  const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    void useAuthStore.persist.rehydrate();
    return unsub;
  }, []);

  return hydrated;
}
