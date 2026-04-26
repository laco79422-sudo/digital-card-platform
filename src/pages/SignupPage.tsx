import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { InactivityToast } from "@/components/auth/InactivityToast";
import { useAuthReady } from "@/hooks/useAuthReady";
import { DUPLICATE_EMAIL_MESSAGE } from "@/lib/auth/authErrorMessage";
import { signInWithGoogle, signUpWithEmail } from "@/lib/auth/authActions";
import { BRAND_DISPLAY_NAME } from "@/lib/brand";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { clearInstantCardId, peekInstantCardId } from "@/lib/instantCardStorage";
import { getLandingEmail, hasPendingCardDraft } from "@/lib/pendingCardStorage";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { mapSupabaseUser } from "@/lib/supabase/mapAuthUser";
import { useAppDataStore } from "@/stores/appDataStore";
import { useAuthStore } from "@/stores/authStore";
import {
  getSignupEmailFieldStatus,
  signupEmailHint,
  signupNameMessages,
  signupPasswordMessages,
  SIGNUP_PASSWORD_MIN_LENGTH,
} from "@/utils/validators";
import { zodResolver } from "@hookform/resolvers/zod";
import { Globe } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";

const SIGNUP_SUCCESS_NOTICE =
  "회원가입이 완료되었습니다. 이메일 인증 후 로그인하면 내 공간에서 명함을 만들고 의뢰도 할 수 있어요.";

const schema = z.object({
  name: z.string().min(1, signupNameMessages.required),
  email: z
    .string()
    .min(1, signupEmailHint.empty)
    .email(signupEmailHint.invalidFormat),
  password: z.string().min(SIGNUP_PASSWORD_MIN_LENGTH, signupPasswordMessages.tooShort),
  role: z.enum(["client", "creator"]),
});

type FormValues = z.infer<typeof schema>;

/**
 * 회원가입 화면 상태 (3종)
 * - loading: 제출 중 — 버튼 비활성 + 문구만 바꿈. 스피너 미사용으로 DOM 자식 수 고정(insertBefore 오류 완화).
 * - errorMessage: 가입 실패·중복 등 — 폼 아래 고정 영역 한 곳에만 표시.
 * - 성공 시: 인라인 메시지 대신 /login 또는 /dashboard 로 이동(기존 동작).
 */
export function SignupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const authReady = useAuthReady();
  const setUser = useAuthStore((s) => s.setUser);
  const setSession = useAuthStore((s) => s.setSession);
  const touchActivity = useAuthStore((s) => s.touchActivity);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "client", name: "", email: "", password: "" },
  });

  const emailValue = watch("email") ?? "";
  const emailFieldStatus = useMemo(() => getSignupEmailFieldStatus(emailValue), [emailValue]);

  /** 이메일 칸 아래: 형식 안내만 (서버 중복 메시지는 errorMessage로만 표시) */
  const emailFormatHint = useMemo(() => {
    switch (emailFieldStatus) {
      case "empty":
        return signupEmailHint.empty;
      case "invalid":
        return signupEmailHint.invalidFormat;
      case "valid":
        return null;
    }
  }, [emailFieldStatus]);

  useEffect(() => {
    if (!authReady) return;
    const oauthErr = (location.state as { oauthError?: string } | null)?.oauthError;
    if (oauthErr) {
      setErrorMessage(oauthErr);
      navigate(".", { replace: true, state: {} });
    }
  }, [authReady, location.state, navigate]);

  useEffect(() => {
    const fromLanding = getLandingEmail();
    if (fromLanding) setValue("email", fromLanding);
  }, [setValue]);

  const onSubmit = async (values: FormValues) => {
    setErrorMessage(null);

    if (!isSupabaseConfigured) {
      setErrorMessage("서비스에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const { data, errorMessage: serverMsg } = await signUpWithEmail({
        email: values.email.trim(),
        password: values.password,
        name: values.name.trim(),
        userType: values.role,
      });

      if (serverMsg) {
        setErrorMessage(serverMsg);
        if (serverMsg === DUPLICATE_EMAIL_MESSAGE) {
          setValue("password", "");
        }
        return;
      }

      if (!data) {
        setErrorMessage("회원가입을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }

      if (data.session?.user) {
        setSession(data.session);
        setUser(mapSupabaseUser(data.session.user));
        touchActivity();
        const instantId = peekInstantCardId();
        if (instantId) {
          useAppDataStore.getState().claimInstantGuestCard(data.session.user.id, instantId);
          clearInstantCardId();
        }
        navigate(
          hasPendingCardDraft() ? "/cards/new" : instantId ? `/cards/${instantId}/edit` : "/dashboard",
          { replace: true },
        );
        return;
      }

      if (data.user) {
        navigate("/login", {
          replace: true,
          state: { signupNotice: SIGNUP_SUCCESS_NOTICE },
        });
        return;
      }

      setErrorMessage("회원가입을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } catch {
      setErrorMessage("회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  const googleSignIn = async () => {
    setErrorMessage(null);
    const { errorMessage: msg } = await signInWithGoogle();
    if (msg) setErrorMessage(msg);
  };

  if (!authReady) {
    return (
      <div className={cn(layout.pageAuth, "flex min-h-[50vh] items-center justify-center py-12 sm:py-20")}>
        <p className="text-sm text-slate-500">화면을 불러오는 중…</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to={hasPendingCardDraft() ? "/cards/new" : "/dashboard"} replace />;
  }

  const signupNoticeFromNav = (location.state as { signupNotice?: string } | null)?.signupNotice;

  return (
    <div className={cn(layout.pageAuth, "py-12 sm:py-20 lg:py-24")}>
      <Card>
        <CardHeader>
          <p className="text-sm font-semibold text-brand-800">{BRAND_DISPLAY_NAME}</p>
          <h1 className="mt-1 text-2xl font-semibold leading-snug tracking-tight text-slate-900">회원가입</h1>
          <p className="mt-2 text-base leading-relaxed text-slate-600">
            {hasPendingCardDraft()
              ? "만들어 두신 명함을 저장하려면 계정이 필요해요. 가입 후 이어서 저장할 수 있습니다."
              : "이름과 이메일로 계정을 만들면, 내 공간에서 명함을 만들고 의뢰도 할 수 있어요."}
          </p>
        </CardHeader>
        <CardContent>
          <InactivityToast authReady={authReady} />
          {signupNoticeFromNav ? (
            <p
              role="status"
              className="mb-4 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2.5 text-sm font-medium text-brand-950"
            >
              {signupNoticeFromNav}
            </p>
          ) : null}
          {!isSupabaseConfigured ? (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950"
            >
              <p className="font-semibold">서비스 연결을 확인할 수 없습니다</p>
              <p className="mt-1 leading-relaxed text-amber-900">
                앱 설정이 완료되지 않았을 수 있어요. 잠시 후 다시 시도하거나 관리자에게 문의해 주세요.
              </p>
            </div>
          ) : null}

          <form
            id="linko-signup-form"
            name="signup"
            method="post"
            autoComplete="on"
            className="space-y-4 pb-6 sm:pb-8"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div>
              <label className="text-base font-medium text-slate-800" htmlFor="role">
                유형
              </label>
              <Select id="role" className="mt-1" {...register("role")} disabled={loading}>
                <option value="client">사업자</option>
                <option value="creator">제작자</option>
              </Select>
            </div>
            <div>
              <label className="text-base font-medium text-slate-800" htmlFor="name">
                이름
              </label>
              <Input
                id="name"
                className="mt-1"
                autoComplete="name"
                enterKeyHint="next"
                {...register("name")}
                disabled={loading}
              />
              {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name.message}</p> : null}
            </div>
            <div>
              <label className="text-base font-medium text-slate-800" htmlFor="email">
                이메일
              </label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                enterKeyHint="next"
                autoComplete="username email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="example@email.com"
                className="mt-1"
                {...register("email", {
                  onChange: () => setErrorMessage(null),
                })}
                disabled={loading}
              />
              {emailFormatHint != null ? (
                <p
                  className={cn(
                    "mt-1.5 text-xs leading-relaxed",
                    emailFieldStatus === "invalid" ? "font-medium text-red-600" : "text-slate-600",
                  )}
                  role="status"
                >
                  {emailFormatHint}
                </p>
              ) : null}
              {errors.email ? (
                <p className="mt-1 text-xs text-red-600" role="alert">
                  {errors.email.message}
                </p>
              ) : null}
            </div>
            <div>
              <label className="text-base font-medium text-slate-800" htmlFor="password">
                비밀번호
              </label>
              <Input
                id="password"
                type="password"
                enterKeyHint="done"
                autoComplete="new-password"
                className="mt-1"
                {...register("password")}
                disabled={loading}
              />
              {errors.password ? (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              ) : null}
            </div>

            {/* 서버/중복 등 제출 결과만 이 블록에 표시 (portal·토스트 없음) */}
            <div className="min-h-[1.5rem] space-y-1">
              {errorMessage ? (
                <p className="text-sm font-medium text-red-600" role="alert">
                  {errorMessage}
                  {errorMessage === DUPLICATE_EMAIL_MESSAGE ? (
                    <>
                      {" "}
                      <Link to="/login" className="font-medium text-brand-700 underline">
                        로그인하기
                      </Link>
                    </>
                  ) : null}
                </p>
              ) : null}
            </div>

            {/* loading 시 스피너를 넣지 않아 자식 노드 수가 바뀌지 않게 함 → insertBefore 오류 완화 */}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "가입 처리 중..." : "회원가입"}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs leading-relaxed text-slate-500">
            구글 로그인은 위에서 입력한 이메일·비밀번호 가입과 별도로 진행됩니다.
          </p>
          <div className="mt-3">
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              size="lg"
              disabled={loading}
              onClick={() => void googleSignIn()}
            >
              <Globe className="h-4 w-4 shrink-0" aria-hidden />
              구글로 시작하기
            </Button>
          </div>
          <p className="mt-6 text-center text-base leading-relaxed text-slate-600">
            이미 계정이 있나요?{" "}
            <Link to="/login" className="font-medium text-brand-700">
              로그인
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
