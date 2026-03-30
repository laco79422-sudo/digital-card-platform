import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import type { UserRole } from "@/types/domain";
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
  const loginDemo = useAuthStore((s) => s.loginDemo);
  const setMockSession = useAuthStore((s) => s.setMockSession);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "client" },
  });

  const onSubmit = async (values: FormValues) => {
    if (!isSupabaseConfigured || !supabase) {
      loginDemo(values.role as UserRole);
      navigate("/dashboard");
      return;
    }
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          name: values.name,
          role: values.role,
        },
      },
    });
    if (error) {
      setError("root", { message: error.message });
      return;
    }
    setMockSession(false);
    navigate("/dashboard");
  };

  return (
    <div className={cn(layout.pageAuth, "py-12 sm:py-20 lg:py-24")}>
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-semibold leading-snug tracking-tight text-slate-900">회원가입</h1>
          <p className="mt-1 text-base leading-relaxed text-slate-600">
            Supabase 미설정 시 데모 계정으로 바로 대시보드에 진입합니다.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="text-base font-medium text-slate-800" htmlFor="role">
                유형
              </label>
              <Select id="role" className="mt-1" {...register("role")}>
                <option value="client">사업자 (클라이언트)</option>
                <option value="creator">제작자 (크리에이터)</option>
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
              가입하고 시작하기
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
