import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { InactivityToast } from "@/components/auth/InactivityToast";
import { useAuthReady } from "@/hooks/useAuthReady";
import { signInWithEmail, signInWithGoogle } from "@/lib/auth/authActions";
import { BRAND_DISPLAY_NAME } from "@/lib/brand";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { getSupabaseConfigErrorMessage, isSupabaseConfigured } from "@/lib/supabase/client";
import { mapSupabaseUser } from "@/lib/supabase/mapAuthUser";
import { useAuthStore } from "@/stores/authStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { Globe } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { signupPasswordMessages, SIGNUP_PASSWORD_MIN_LENGTH } from "@/utils/validators";
import { z } from "zod";

const schema = z.object({
  email: z.string().min(1, "이메일을 입력하세요").email("형식이 올바르지 않습니다"),
  password: z.string().min(SIGNUP_PASSWORD_MIN_LENGTH, signupPasswordMessages.tooShort),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";
  const signupNotice = (location.state as { signupNotice?: string } | null)?.signupNotice;
  const user = useAuthStore((s) => s.user);
  const authReady = useAuthReady();
  const setUser = useAuthStore((s) => s.setUser);
  const setSession = useAuthStore((s) => s.setSession);
  const touchActivity = useAuthStore((s) => s.touchActivity);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!authReady) return;
    const oauthErr = (location.state as { oauthError?: string } | null)?.oauthError;
    if (oauthErr) {
      setError("root", { message: oauthErr });
      navigate(".", { replace: true, state: {} });
    }
  }, [authReady, location.state, navigate, setError]);

  const onSubmit = async (values: FormValues) => {
    clearErrors("root");
    if (!isSupabaseConfigured) {
      setError("root", { message: getSupabaseConfigErrorMessage() });
      return;
    }
    const { user: u, session: sess, errorMessage } = await signInWithEmail(values.email, values.password);
    if (errorMessage) {
      setError("root", { message: errorMessage });
      return;
    }
    if (!u) {
      setError("root", {
        message: "로그인에 성공했지만 사용자 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
      });
      return;
    }
    if (sess) setSession(sess);
    setUser(mapSupabaseUser(u));
    touchActivity();
    navigate(from, { replace: true });
  };

  const googleSignIn = async () => {
    clearErrors("root");
    const { errorMessage } = await signInWithGoogle();
    if (errorMessage) {
      setError("root", { message: errorMessage });
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
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className={cn(layout.pageAuth, "py-12 sm:py-20 lg:py-24")}>
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
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="text-base font-medium text-slate-800" htmlFor="email">
                이메일
              </label>
              <Input id="email" type="email" autoComplete="email" className="mt-1" {...register("email")} />
              {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email.message}</p> : null}
            </div>
            <div>
              <label className="text-base font-medium text-slate-800" htmlFor="password">
                비밀번호
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                className="mt-1"
                {...register("password")}
              />
              {errors.password ? (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              ) : null}
            </div>
            {errors.root ? (
              <p className="text-sm text-red-600">{errors.root.message}</p>
            ) : null}
            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              로그인
            </Button>
          </form>
          <p className="mt-4 text-center text-xs leading-relaxed text-slate-500">
            구글 로그인은 입력한 이메일/비밀번호와 별도로 진행됩니다.
          </p>
          <div className="mt-3">
            <Button type="button" variant="secondary" className="w-full" size="lg" onClick={() => void googleSignIn()}>
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
