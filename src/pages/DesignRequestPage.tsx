import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  buildDesignRequest,
  createDesignRequest,
  startDesignPayment,
} from "@/services/designRequestsService";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { useAppDataStore } from "@/stores/appDataStore";
import { useAuthStore } from "@/stores/authStore";
import type { DesignRequestStyle } from "@/types/domain";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const styleOptions: Array<{ value: DesignRequestStyle; label: string }> = [
  { value: "simple", label: "심플" },
  { value: "premium", label: "고급" },
  { value: "emotional", label: "감성" },
  { value: "business", label: "비즈니스" },
  { value: "free", label: "자유형" },
];

const schema = z.object({
  name: z.string().min(1, "이름을 입력해 주세요."),
  phone: z.string().min(1, "연락처를 입력해 주세요."),
  email: z.string().email("이메일 형식으로 입력해 주세요."),
  business_type: z.string().min(1, "업종을 입력해 주세요."),
  style: z.enum(["simple", "premium", "emotional", "business", "free"]),
  reference_url: z.string().optional(),
  request_message: z.string().min(5, "요청사항을 5자 이상 입력해 주세요."),
});

type FormValues = z.infer<typeof schema>;

export function DesignRequestPage() {
  const user = useAuthStore((s) => s.user);
  const upsertDesignRequest = useAppDataStore((s) => s.upsertDesignRequest);
  const [completeMessage, setCompleteMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name ?? "",
      phone: user?.phone ?? "",
      email: user?.email ?? "",
      style: "simple",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const request = buildDesignRequest({
      id: crypto.randomUUID(),
      user_id: user?.id ?? null,
      name: values.name.trim(),
      phone: values.phone.trim(),
      email: values.email.trim(),
      business_type: values.business_type.trim(),
      style: values.style,
      reference_url: values.reference_url?.trim() || null,
      request_message: values.request_message.trim(),
    });
    const result = await createDesignRequest(request);
    upsertDesignRequest(result.request);
    await startDesignPayment(result.request);
    setCompleteMessage("의뢰가 접수되었습니다. 결제 확인 후 명함 디자인 전문가가 시안을 준비합니다.");
    reset({ ...values, request_message: "" });
  });

  return (
    <div className={cn(layout.pageForm, "py-10 sm:py-12")}>
      <div className="mb-6">
        <h1 className="break-keep text-2xl font-bold leading-snug tracking-tight text-slate-900 md:text-3xl">
          명함 디자인 제작 의뢰
        </h1>
        <p className="mt-2 text-base leading-relaxed text-slate-600">
          원하는 분위기와 정보를 남겨주시면, 명함 디자인 전문가가 시안을 제작해 드립니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">의뢰 정보</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            결제 시스템 연결 전까지는 접수 상태로 저장됩니다.
          </p>
        </CardHeader>
        <CardContent>
          {completeMessage ? (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-900">
              {completeMessage}
            </div>
          ) : null}
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-base font-medium text-slate-800">이름</label>
                <Input className="mt-1" {...register("name")} />
                {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name.message}</p> : null}
              </div>
              <div>
                <label className="text-base font-medium text-slate-800">연락처</label>
                <Input className="mt-1" inputMode="tel" {...register("phone")} />
                {errors.phone ? <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p> : null}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-base font-medium text-slate-800">이메일</label>
                <Input className="mt-1" type="email" {...register("email")} />
                {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email.message}</p> : null}
              </div>
              <div>
                <label className="text-base font-medium text-slate-800">업종</label>
                <Input className="mt-1" {...register("business_type")} />
                {errors.business_type ? (
                  <p className="mt-1 text-xs text-red-600">{errors.business_type.message}</p>
                ) : null}
              </div>
            </div>
            <div>
              <label className="text-base font-medium text-slate-800">원하는 스타일 선택</label>
              <Select className="mt-1" {...register("style")}>
                {styleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-base font-medium text-slate-800">참고 링크</label>
              <Input className="mt-1" type="url" placeholder="https://..." {...register("reference_url")} />
            </div>
            <div>
              <label className="text-base font-medium text-slate-800">요청사항</label>
              <Textarea className="mt-1" rows={6} {...register("request_message")} />
              {errors.request_message ? (
                <p className="mt-1 text-xs text-red-600">{errors.request_message.message}</p>
              ) : null}
            </div>
            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              결제하고 제작 신청하기
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
