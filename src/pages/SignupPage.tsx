import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { InactivityToast } from "@/components/auth/InactivityToast";
import { useAuthReady } from "@/hooks/useAuthReady";
import { DUPLICATE_EMAIL_MESSAGE } from "@/lib/auth/authErrorMessage";
import { signInWithGoogle, signUpWithEmail } from "@/lib/auth/authActions";
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
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2, "이름을 입력하세요"),
  email: z.string().min(1).email(),
  password: z.string().min(6),
  role: z.enum(["client", "creator"]),
});

type FormValues = z.infer<typeof schema>;

export function SignupPage() {
  const navigate = useNavigate();
  const location = useLocation();
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
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "client" },
  });

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
    const { data, errorMessage } = await signUpWithEmail({
      email: values.email,
      password: values.password,
      name: values.name,
      role: values.role,
    });
    if (errorMessage) {
      if (errorMessage === DUPLICATE_EMAIL_MESSAGE) {
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
              <Input
                id="email"
                type="email"
                className="mt-1"
                {...register("email", {
                  onChange: () => {
                    clearErrors("email");
                    clearErrors("root");
                  },
                })}
              />
              {errors.email ? (
                <p className="mt-1 text-xs text-red-600" role="alert">
                  {errors.email.message}
                  {errors.email.type === "duplicate" ? (
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
            <div>
              <label className="text-base font-medium text-slate-800" htmlFor="password">
                비밀번호
              </label>
              <Input id="password" type="password" className="mt-1" {...register("password")} />
              {errors.password ? (
                <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
              ) : null}
            </div>
            {errors.root ? <p className="text-sm text-red-600">{errors.root.message}</p> : null}
            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
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
