import { StableLoginForm } from "@/components/auth/StableLoginForm";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { InactivityToast } from "@/components/auth/InactivityToast";
import { useAuthReady } from "@/hooks/useAuthReady";
import {
  isEmailConfirmed,
  resendSignupConfirmationEmail,
  signInWithEmail,
  signInWithGoogle,
} from "@/lib/auth/authActions";
import { BRAND_DISPLAY_NAME } from "@/lib/brand";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { clearInstantCardId, peekInstantCardId } from "@/lib/instantCardStorage";
import { getSupabaseConfigErrorMessage, isSupabaseConfigured } from "@/lib/supabase/client";
import { mapSupabaseUser } from "@/lib/supabase/mapAuthUser";
import { useDevMountLog } from "@/dev/renderDiagnostics";
import { useAppDataStore } from "@/stores/appDataStore";
import { useAuthStore } from "@/stores/authStore";
import { Globe } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

export function LoginPage() {
  useDevMountLog("LoginPage");
  const navigate = useNavigate();
  const location = useLocation();
  const signupNotice = (location.state as { signupNotice?: string } | null)?.signupNotice;
  const user = useAuthStore((s) => s.user);
  const authReady = useAuthReady();
  const setUser = useAuthStore((s) => s.setUser);
  const setSession = useAuthStore((s) => s.setSession);
  const touchActivity = useAuthStore((s) => s.touchActivity);

  const [remoteError, setRemoteError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [credentialsBusy, setCredentialsBusy] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authReady) return;
    const oauthErr = (location.state as { oauthError?: string } | null)?.oauthError;
    if (oauthErr) {
      setRemoteError(oauthErr);
      navigate(".", { replace: true, state: {} });
    }
  }, [authReady, location.state, navigate]);

  const handleCredentials = async (email: string, password: string) => {
    setRemoteError(null);
    setResendMessage(null);
    setUnverifiedEmail("");
    if (!isSupabaseConfigured) {
      setRemoteError(getSupabaseConfigErrorMessage());
      return;
    }
    const { user: u, session: sess, errorMessage } = await signInWithEmail(email, password);
    if (errorMessage) {
      setRemoteError(errorMessage);
      if (errorMessage.includes("이메일 인증")) setUnverifiedEmail(email);
      return;
    }
    if (!u) {
      setRemoteError("로그인에 성공했지만 사용자 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    if (!isEmailConfirmed(u)) {
      if (sess) setSession(sess);
      setUser(mapSupabaseUser(u));
      setUnverifiedEmail(u.email ?? email);
      setRemoteError("이메일 인증이 필요해요. 기존에 가입하신 계정도 안전한 이용을 위해 이메일 인증을 완료해야 합니다.");
      return;
    }
    if (sess) setSession(sess);
    setUser(mapSupabaseUser(u));
    touchActivity();
    const instantId = peekInstantCardId();
    if (instantId) {
      useAppDataStore.getState().claimInstantGuestCard(u.id, instantId);
      clearInstantCardId();
    }
    navigate("/", {
      replace: true,
      state: { loginNotice: "로그인되었습니다. 이제 메인화면에서 명함 만들기와 내 공간을 이용할 수 있어요." },
    });
  };

  const resendVerification = async () => {
    if (!unverifiedEmail) return;
    setResending(true);
    setRemoteError(null);
    setResendMessage(null);
    try {
      const { errorMessage } = await resendSignupConfirmationEmail(unverifiedEmail);
      if (errorMessage) {
        setRemoteError(errorMessage);
      } else {
        setResendMessage("인증 메일을 다시 보냈습니다. 이메일함을 확인해 주세요.");
      }
    } finally {
      setResending(false);
    }
  };

  const googleSignIn = async () => {
    setRemoteError(null);
    setGoogleLoading(true);
    try {
      const { errorMessage } = await signInWithGoogle();
      if (errorMessage) setRemoteError(errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  if (!authReady) {
    return (
      <div className={cn(layout.pageAuth, "flex min-h-[50vh] items-center justify-center py-12 sm:py-20")}>
        <p className="text-sm text-slate-500">화면을 불러오는 중…</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div
      className={cn(
        layout.pageAuth,
        "min-h-dvh py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:py-20 lg:py-24",
      )}
    >
      <Card>
        <CardHeader>
          <p className="text-sm font-semibold text-brand-800">{BRAND_DISPLAY_NAME}</p>
          <h1 className="mt-1 text-2xl font-semibold leading-snug tracking-tight text-slate-900">로그인</h1>
          <p className="mt-2 text-base leading-relaxed text-slate-600">
            연결되는 나의 시작, {BRAND_DISPLAY_NAME} 계정으로 이어가세요.
          </p>
        </CardHeader>
        <CardContent>
          <InactivityToast authReady={authReady} />
          {!isSupabaseConfigured ? (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950"
            >
              <p className="font-semibold">Supabase 연결 정보가 없거나 올바르지 않습니다</p>
              <p className="mt-1 leading-relaxed text-amber-900">{getSupabaseConfigErrorMessage()}</p>
              <p className="mt-2 text-xs text-amber-800/90">
                프로젝트 루트 `.env`에 값을 넣은 뒤 반드시 개발 서버를 다시 시작하세요.
              </p>
            </div>
          ) : null}
          {signupNotice ? (
            <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              {signupNotice}
            </p>
          ) : null}
          <StableLoginForm
            onCredentialsSubmit={handleCredentials}
            disabled={googleLoading}
            externalError={remoteError}
            onClearExternalError={() => setRemoteError(null)}
            onBusyChange={setCredentialsBusy}
          />
          {unverifiedEmail ? (
            <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
              <p className="font-bold">이메일 인증이 필요해요.</p>
              <p className="mt-1 leading-relaxed">
                기존에 가입하신 계정도 안전한 이용을 위해 이메일 인증을 완료해야 합니다.
              </p>
              <button
                type="button"
                className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-cta-500 px-4 font-bold text-white hover:bg-cta-600 disabled:cursor-not-allowed disabled:opacity-70"
                onClick={() => void resendVerification()}
                disabled={resending}
              >
                {resending ? "인증 메일 보내는 중..." : "인증 메일 다시 보내기"}
              </button>
              {resendMessage ? <p className="mt-2 font-medium text-emerald-700">{resendMessage}</p> : null}
              <p className="mt-2 text-xs leading-relaxed text-amber-800">
                기존 계정과 명함 데이터는 그대로 유지됩니다. 인증만 완료해 주세요.
              </p>
            </div>
          ) : null}
          <p className="mt-4 text-center text-xs leading-relaxed text-slate-500">
            구글 로그인은 입력한 이메일/비밀번호와 별도로 진행됩니다.
          </p>
          <div className="mt-3">
            <Button
              type="button"
              variant="secondary"
              className="w-full min-h-[52px] sm:min-h-12"
              size="lg"
              loading={googleLoading}
              disabled={googleLoading || credentialsBusy}
              onClick={() => void googleSignIn()}
            >
              <Globe className="h-4 w-4 shrink-0" aria-hidden />
              구글로 시작하기
            </Button>
          </div>
          <p className="mt-6 text-center text-base leading-relaxed text-slate-600">
            계정이 없으신가요?{" "}
            <Link to="/signup" className="font-medium text-brand-700">
              회원가입
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
