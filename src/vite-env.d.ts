/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_USE_MOCK_AUTH?: string;
  /** 카카오 JavaScript 키 — 없으면 Kakao.Link 미사용, Web Share·복사만 사용 */
  readonly VITE_KAKAO_JS_KEY?: string;
  /** 카카오 JS 키 (별칭) — `VITE_KAKAO_JS_KEY`와 동일 용도 */
  readonly VITE_KAKAO_JAVASCRIPT_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
