/**
 * @deprecated 직접 import 대신 `@/lib/auth/authActions`의 `signInWithGoogle` 사용을 권장합니다.
 * 기존 import 경로 호환용 re-export입니다.
 */
export {
  getOAuthRedirectToDashboard,
  GOOGLE_AUTH_PROVIDER,
  signInWithGoogle as startGoogleOAuthSignIn,
} from "@/lib/auth/authActions";
