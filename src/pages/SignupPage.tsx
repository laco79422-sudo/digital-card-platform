import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { InactivityToast } from "@/components/auth/InactivityToast";
import { useAuthReady } from "@/hooks/useAuthReady";
import { DUPLICATE_EMAIL_MESSAGE } from "@/lib/auth/authErrorMessage";
import {
  SIGNUP_EMAIL_ALREADY_REGISTERED,
  SIGNUP_EMAIL_GUIDE_AVAILABLE,
  SIGNUP_EMAIL_GUIDE_CHECKING,
  SIGNUP_EMAIL_GUIDE_DEFAULT,
  SIGNUP_EMAIL_GUIDE_FORMAT,
  SIGNUP_EMAIL_RPC_UNAVAILABLE,
  fetchIsEmailRegistered,
  isValidSignupEmailFormat,
} from "@/lib/auth/checkEmailAvailability";
import { signInWithGoogle, signUpWithEmail } from "@/lib/auth/authActions";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { getSupabaseConfigErrorMessage, isSupabaseConfigured } from "@/lib/supabase/client";
import { mapSupabaseUser } from "@/lib/supabase/mapAuthUser";
import { useAuthStore } from "@/stores/authStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { Globe } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2, "이름을 입력하세요"),
  email: z
    .string()
    .min(1, "이메일을 입력해 주세요.")
    .email("올바른 이메일 형식이 아닙니다."),
  password: z.string().min(6),
  role: z.enum(["client", "creator"]),
});

type FormValues = z.infer<typeof schema>;

type EmailHelpKind =
  | "default"
  | "format_error"
  | "pending_check"
  | "checking"
  | "registered"
  | "available"
  | "unavailable";

function emailHelpLabel(kind: EmailHelpKind): string {
  switch (kind) {
    case "format_error":
      return SIGNUP_EMAIL_GUIDE_FORMAT;
    case "checking":
      return SIGNUP_EMAIL_GUIDE_CHECKING;
    case "registered":
      return SIGNUP_EMAIL_ALREADY_REGISTERED;
    case "available":
      return SIGNUP_EMAIL_GUIDE_AVAILABLE;
    case "unavailable":
      return SIGNUP_EMAIL_RPC_UNAVAILABLE;
    case "default":
    case "pending_check":
    default:
      return SIGNUP_EMAIL_GUIDE_DEFAULT;
  }
}

function emailHelpClass(kind: EmailHelpKind): string {
  if (kind === "format_error" || kind === "registered") {
    return "font-medium text-red-600";
  }
  if (kind === "available") return "text-green-700";
  if (kind === "unavailable") return "text-amber-800";
  return "text-slate-600";
}

export function SignupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const authReady = useAuthReady();
  const setUser = useAuthStore((s) => s.setUser);
  const setSession = useAuthStore((s) => s.setSession);
  const touchActivity = useAuthStore((s) => s.touchActivity);

  const [emailHelp, setEmailHelp] = useState<EmailHelpKind>("default");
  const seqRef = useRef(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "client", name: "", email: "", password: "" },
  });

  const runEmailAvailability = useCallback(async (raw: string, generation: number) => {
    const trimmed = raw.trim();
    if (!trimmed || !isValidSignupEmailFormat(raw)) return;
    if (generation !== seqRef.current) return;
    setEmailHelp("checking");
    const result = await fetchIsEmailRegistered(trimmed);
    if (generation !== seqRef.current) return;
    if (!result.ok) {
      setEmailHelp("unavailable");
      return;
    }
    setEmailHelp(result.registered ? "registered" : "available");
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

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
    clearErrors("email");
    if (!isSupabaseConfigured) {
      setError("root", { message: getSupabaseConfigErrorMessage() });
      return;
    }

    const emailTrimmed = values.email.trim();
    if (!isValidSignupEmailFormat(values.email)) {
      setEmailHelp("format_error");
      setError("email", { message: SIGNUP_EMAIL_GUIDE_FORMAT });
      return;
    }

    if (emailHelp === "checking") {
      setError("root", { message: "이메일 확인 중입니다. 잠시 후 다시 시도해 주세요." });
      return;
    }

    const finalCheck = await fetchIsEmailRegistered(emailTrimmed);
    if (finalCheck.ok && finalCheck.registered) {
      setEmailHelp("registered");
      setError("email", { type: "duplicate", message: DUPLICATE_EMAIL_MESSAGE });
      return;
    }

    const { data, errorMessage } = await signUpWithEmail({
      email: emailTrimmed,
      password: values.password,
      name: values.name,
      role: values.role,
    });
    if (errorMessage) {
      if (errorMessage === DUPLICATE_EMAIL_MESSAGE) {
        setEmailHelp("registered");
        setError("email", { type: "duplicate", message: errorMessage });
      } else {
        setError("root", { message: errorMessage });
      }
      return;
    }
    if (!data) {
      setError("root", {
        message: "회원가입을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      });
      return;
    }
    if (data.session?.user) {
      setSession(data.session);
      setUser(mapSupabaseUser(data.session.user));
      touchActivity();
      navigate("/dashboard", { replace: true });
      return;
    }
    if (data.user) {
      navigate("/login", {
        replace: true,
        state: {
          signupNotice:
            "가입 확인 메일을 보냈어요. 메일의 링크를 연 뒤 로그인해 주세요. (대시보드에서 이메일 인증을 끈 경우에는 바로 로그인을 시도해 보세요.)",
        },
      });
      return;
    }
    setError("root", {
      message: "회원가입을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    });
  };

  const googleSignIn = async () => {
    clearErrors("root");
    const { errorMessage } = await signInWithGoogle();
    if (errorMessage) {
      setError("root", { message: errorMessage });
    }
  };

  const submitBlocked =
    isSubmitting ||
    emailHelp === "registered" ||
    emailHelp === "checking" ||
    emailHelp === "format_error";

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
          <p className="text-sm font-semibold text-brand-800">Linko 명함</p>
          <h1 className="mt-1 text-2xl font-semibold leading-snug tracking-tight text-slate-900">회원가입</h1>
          <p className="mt-2 text-base leading-relaxed text-slate-600">
            이름과 이메일로 계정을 만든 뒤, 대시보드에서 명함과 의뢰를 이용할 수 있어요.
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
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="text-base font-medium text-slate-800" htmlFor="role">
                유형
              </label>
              <Select id="role" className="mt-1" {...register("role")}>
                <option value="client">사업자</option>
                <option value="creator">제작자</option>
              </Select>
            </div>
            <div>
              <label className="text-base font-medium text-slate-800" htmlFor="name">
                이름
              </label>
              <Input id="name" className="mt-1" {...register("name")} />
              {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name.message}</p> : null}
            </div>
            <div>
              <label className="text-base font-medium text-slate-800" htmlFor="email">
                이메일
              </label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className="mt-1"
                    {...field}
                    onBlur={(e) => {
                      field.onBlur();
                      if (debounceTimerRef.current) {
                        clearTimeout(debounceTimerRef.current);
                        debounceTimerRef.current = null;
                      }
                      seqRef.current += 1;
                      const generation = seqRef.current;
                      const raw = e.target.value;
                      clearErrors("email");
                      clearErrors("root");
                      if (!raw.trim()) {
                        setEmailHelp("default");
                        return;
                      }
                      if (!isValidSignupEmailFormat(raw)) {
                        setEmailHelp("format_error");
                        return;
                      }
                      void runEmailAvailability(raw, generation);
                    }}
                    onChange={(e) => {
                      const raw = e.target.value;
                      field.onChange(raw);
                      clearErrors("email");
                      clearErrors("root");
                      if (debounceTimerRef.current) {
                        clearTimeout(debounceTimerRef.current);
                        debounceTimerRef.current = null;
                      }
                      seqRef.current += 1;
                      const generation = seqRef.current;
                      if (!raw.trim()) {
                        setEmailHelp("default");
                        return;
                      }
                      if (!isValidSignupEmailFormat(raw)) {
                        setEmailHelp("format_error");
                        return;
                      }
                      setEmailHelp("pending_check");
                      debounceTimerRef.current = setTimeout(() => {
                        debounceTimerRef.current = null;
                        if (generation !== seqRef.current) return;
                        void runEmailAvailability(raw, generation);
                      }, 500);
                    }}
                  />
                )}
              />
              <p className={cn("mt-1.5 text-xs leading-relaxed", emailHelpClass(emailHelp))} role="status">
                {emailHelpLabel(emailHelp)}
                {emailHelp === "registered" ? (
                  <>
                    {" "}
                    <Link to="/login" className="font-medium text-brand-700 underline">
                      로그인하기
                    </Link>
                  </>
                ) : null}
              </p>
              {errors.email && errors.email.type !== "duplicate" ? (
                <p className="mt-1 text-xs text-red-600" role="alert">
                  {errors.email.message}
                </p>
              ) : null}
            </div>
            <div>
              <label className="text-base font-medium text-slate-800" htmlFor="password">
                비밀번호
              </label>
              <Input id="password" type="password" autoComplete="new-password" className="mt-1" {...register("password")} />
              {errors.password ? (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              ) : null}
            </div>
            {errors.root ? <p className="text-sm text-red-600">{errors.root.message}</p> : null}
            <Button type="submit" className="w-full" size="lg" loading={isSubmitting} disabled={submitBlocked}>
              회원가입
            </Button>
          </form>
          <p className="mt-4 text-center text-xs leading-relaxed text-slate-500">
            구글 로그인은 위에 입력한 이메일/비밀번호와 별도로 진행됩니다. 동일 이메일은 Supabase에서 하나의
            사용자로 연결되도록 설정할 수 있어요.
          </p>
          <div className="mt-3">
            <Button type="button" variant="secondary" className="w-full" size="lg" onClick={() => void googleSignIn()}>
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
