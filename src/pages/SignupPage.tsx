import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { authErrorToKorean } from "@/lib/auth/authErrorMessage";
import {
  getSupabaseConfigErrorMessage,
  isSupabaseConfigured,
  supabase,
} from "@/lib/supabase/client";
import { mapSupabaseUser } from "@/lib/supabase/mapAuthUser";
import { useAuthStore } from "@/stores/authStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
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
  const setUser = useAuthStore((s) => s.setUser);

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

  const onSubmit = async (values: FormValues) => {
    clearErrors("root");
    if (!isSupabaseConfigured || !supabase) {
      setError("root", { message: getSupabaseConfigErrorMessage() });
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          name: values.name,
          role: values.role,
        },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) {
      setError("root", { message: authErrorToKorean(error.message) });
      return;
    }
    if (data.session?.user) {
      setUser(mapSupabaseUser(data.session.user));
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
              <Input id="email" type="email" className="mt-1" {...register("email")} />
              {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email.message}</p> : null}
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
