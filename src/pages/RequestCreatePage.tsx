import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useAppDataStore } from "@/stores/appDataStore";
import type { ServiceRequest, ServiceRequestType } from "@/types/domain";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";

const schema = z.object({
  request_type: z.enum(["blog", "youtube", "shortform", "thumbnail"]),
  title: z.string().min(3),
  description: z.string().min(10),
  budget_min: z.string().optional(),
  budget_max: z.string().optional(),
  deadline: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function RequestCreatePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const upsertServiceRequest = useAppDataStore((s) => s.upsertServiceRequest);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { request_type: "blog" },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!user) return;
    const req: ServiceRequest = {
      id: crypto.randomUUID(),
      client_user_id: user.id,
      request_type: values.request_type as ServiceRequestType,
      title: values.title,
      description: values.description,
      budget_min:
        values.budget_min && Number.isFinite(Number(values.budget_min))
          ? Number(values.budget_min)
          : null,
      budget_max:
        values.budget_max && Number.isFinite(Number(values.budget_max))
          ? Number(values.budget_max)
          : null,
      deadline: values.deadline || null,
      status: "open",
      created_at: new Date().toISOString(),
      client_name: user.name,
    };
    upsertServiceRequest(req);
    navigate("/requests");
  });

  return (
    <div className={cn(layout.pageForm, "py-10 sm:py-12")}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold leading-snug tracking-tight text-slate-900 md:text-3xl">의뢰 등록</h1>
        <Link
          to="/requests"
          className="inline-flex min-h-11 shrink-0 items-center text-base font-medium text-brand-700"
        >
          목록
        </Link>
      </div>
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">브리프</h2>
          <p className="mt-1 text-base leading-relaxed text-slate-600">
            제작자가 지원할 수 있도록 구체적으로 적어 주세요.
          </p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="text-base font-medium text-slate-800">유형</label>
              <Select className="mt-1" {...register("request_type")}>
                <option value="blog">블로그</option>
                <option value="youtube">유튜브</option>
                <option value="shortform">숏폼</option>
                <option value="thumbnail">썸네일</option>
              </Select>
            </div>
            <div>
              <label className="text-base font-medium text-slate-800">제목</label>
              <Input className="mt-1" {...register("title")} />
              {errors.title ? <p className="mt-1 text-xs text-red-600">{errors.title.message}</p> : null}
            </div>
            <div>
              <label className="text-base font-medium text-slate-800">상세 설명</label>
              <Textarea className="mt-1" rows={5} {...register("description")} />
              {errors.description ? (
                <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-base font-medium text-slate-800">예산 최소 (원)</label>
                <Input className="mt-1" type="number" {...register("budget_min")} />
              </div>
              <div>
                <label className="text-base font-medium text-slate-800">예산 최대 (원)</label>
                <Input className="mt-1" type="number" {...register("budget_max")} />
              </div>
            </div>
            <div>
              <label className="text-base font-medium text-slate-800">마감일</label>
              <Input className="mt-1" type="date" {...register("deadline")} />
            </div>
            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              등록하기
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
