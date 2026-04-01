/**
 * Supabase 브라우저 클라이언트 (Vite + React)
 *
 * 프로젝트 루트 `.env` 에 다음을 넣습니다 (값은 Supabase 대시보드 → Project Settings → API).
 * - `VITE_SUPABASE_URL` — Project URL (https://xxxx.supabase.co)
 * - `VITE_SUPABASE_ANON_KEY` — anon public 키 (JWT, 보통 eyJ 로 시작)
 *
 * 수정 후에는 개발 서버를 한 번 재시작해야 반영됩니다.
 *
 * 실제 `createClient` 는 `supabase/client.ts` 에 있고, 여기서는 같은 것을
 * `@/lib/supabase` 로 짧게 import 하기 위해 내보냅니다.
 */
export {
  getSupabaseConfigErrorMessage,
  isSupabaseConfigured,
  supabase,
} from "@/lib/supabase/client";
