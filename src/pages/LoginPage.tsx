import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import type { UserRole } from "@/types/domain";
import { zodResolver } from "@hookform/resolvers/zod";
import { Globe } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";

const schema = z.object({
  email: z.string().min(1, "이메일을 입력하세요").email("형식이 올바르지 않습니다"),
  password: z.string().min(6, "6자 이상 입력하세요"),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";
  const loginDemo = useAuthStore((s) => s.loginDemo);
  const setMockSession = useAuthStore((s) => s.setMockSession);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    if (!isSupabaseConfigured || !supabase) {
      setError("root", { message: "Supabase가 설정되지 않았습니다. 데모 로그인을 이용하세요." });
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    if (error) {
      setError("root", { message: error.message });
      return;
    }
    setMockSession(false);
    navigate(from, { replace: true });
  };

  const googlePlaceholder = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setError("root", { message: "Supabase에 OAuth를 연결하면 Google 로그인이 활성화됩니다." });
      return;
    }
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
  };

  const demo = (role: UserRole) => {
    loginDemo(role);
    navigate(from, { replace: true });
  };

  return (
    <div className={cn(layout.pageAuth, "py-12 sm:py-20 lg:py-24")}>
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-semibold leading-snug tracking-tight text-slate-900">로그인</h1>
          <p className="mt-1 text-base leading-relaxed text-slate-600">BizCard Connect 계정으로 계속하세요.</p>
        </CardHeader>
        <CardContent>
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
              <p className="text-sm text-amber-700">{errors.root.message}</p>
            ) : null}
            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              로그인
            </Button>
          </form>
          <div className="mt-4">
            <Button type="button" variant="secondary" className="w-full" size="lg" onClick={googlePlaceholder}>
              <Globe className="h-4 w-4" />
              Google로 계속하기 (연동 시)
            </Button>
          </div>
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-600">데모 세션 (즉시 체험)</p>
            <div className="mt-3 flex flex-col gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => demo("client")}>
                사업자 데모
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => demo("creator")}>
                제작자 데모
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => demo("admin")}>
                관리자 데모
              </Button>
            </div>
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
