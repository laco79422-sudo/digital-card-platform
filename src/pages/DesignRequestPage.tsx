import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { resendSignupConfirmationEmail } from "@/lib/auth/authActions";
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
import { Navigate } from "react-router-dom";
import { z } from "zod";

const styleOptions: Array<{ value: DesignRequestStyle; label: string }> = [
  { value: "simple", label: "심플" },
  { value: "premium", label: "고급" },
  { value: "emotional", label: "감성" },
  { value: "business", label: "비즈니스" },
  { value: "free", label: "자유형" },
];

const DEFAULT_BUSINESS_TYPE = "사업자 없음";

const schema = z.object({
  name: z.string().trim().min(2, "이름을 입력해 주세요."),
  phone: z.string().regex(/^\d{10,11}$/, "올바른 휴대폰 번호를 입력해 주세요."),
  email: z.string().email("이메일 형식으로 입력해 주세요."),
  business_type: z.string().optional(),
  style: z.enum(["simple", "premium", "emotional", "business", "free"]),
  reference_url: z.string().optional(),
  request_message: z.string().min(5, "요청사항을 5자 이상 입력해 주세요."),
});

type FormValues = z.infer<typeof schema>;

export function DesignRequestPage() {
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.authLoading);
  const upsertDesignRequest = useAppDataStore((s) => s.upsertDesignRequest);
  const [completeMessage, setCompleteMessage] = useState<string | null>(null);
  const [step, setStep] = useState<"identity" | "request">("identity");
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name ?? "",
      phone: user?.phone ?? "",
      email: user?.email ?? "",
      business_type: DEFAULT_BUSINESS_TYPE,
      style: "simple",
    },
  });

  if (authLoading) {
    return (
      <div className={cn(layout.pageForm, "flex min-h-[40vh] items-center justify-center py-12")}>
        <p className="text-sm text-slate-500">인증 정보를 확인하는 중...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: "/request" }} />;
  }

  const resendVerification = async () => {
    setResendMessage(null);
    setResendError(null);
    setResending(true);
    try {
      const { errorMessage } = await resendSignupConfirmationEmail(user.email);
      if (errorMessage) {
        setResendError(errorMessage);
      } else {
        setResendMessage("인증 메일을 다시 보냈습니다. 이메일함을 확인해 주세요.");
      }
    } finally {
      setResending(false);
    }
  };

  const goNextStep = async () => {
    const ok = await trigger(["name", "phone", "email"], { shouldFocus: true });
    if (!ok) return;
    setStep("request");
  };

  const onSubmit = handleSubmit(async (values) => {
    const request = buildDesignRequest({
      id: crypto.randomUUID(),
      user_id: user.id,
      name: values.name.trim(),
      phone: values.phone.trim(),
      email: values.email.trim(),
      verified_name: values.name.trim(),
      verified_phone: values.phone.trim(),
      verified_email: values.email.trim(),
      email_verified: true,
      business_type: values.business_type?.trim() || DEFAULT_BUSINESS_TYPE,
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

  if (!user.email_confirmed_at) {
    return (
      <div className={cn(layout.pageForm, "py-10 sm:py-12")}>
        <div className="mb-6">
          <h1 className="break-keep text-2xl font-bold leading-snug tracking-tight text-slate-900 md:text-3xl">
            명함 디자인 제작 의뢰
          </h1>
          <p className="mt-2 text-base leading-relaxed text-slate-600">
            제작 의뢰 전에 이메일 인증을 먼저 확인합니다.
          </p>
        </div>
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-slate-900">1단계: 본인 확인</h2>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
              <p className="font-bold">이메일 인증이 필요합니다.</p>
              <p className="mt-1 leading-relaxed">가입하신 이메일함에서 인증 메일을 확인해 주세요.</p>
              <p className="mt-3 break-all rounded-xl bg-white/70 px-3 py-2 font-semibold">{user.email}</p>
              <button
                type="button"
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-cta-500 px-4 text-sm font-bold text-white hover:bg-cta-600 disabled:cursor-not-allowed disabled:opacity-70"
                onClick={() => void resendVerification()}
                disabled={resending}
              >
                {resending ? "인증 메일 보내는 중..." : "인증 메일 다시 보내기"}
              </button>
              {resendMessage ? <p className="mt-3 font-medium text-emerald-700">{resendMessage}</p> : null}
              {resendError ? <p className="mt-3 font-medium text-red-600">{resendError}</p> : null}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <h2 className="text-lg font-semibold text-slate-900">
            {step === "identity" ? "1단계: 본인 확인" : "2단계: 의뢰 정보 입력"}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            {step === "identity"
              ? "제작 의뢰 전에 이름, 휴대폰 번호, 이메일 인증 상태를 확인합니다."
              : "결제 시스템 연결 전까지는 접수 상태로 저장됩니다."}
          </p>
        </CardHeader>
        <CardContent>
          {completeMessage ? (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-900">
              {completeMessage}
            </div>
          ) : null}
          <form className="space-y-4" onSubmit={onSubmit}>
            {step === "identity" ? (
              <>
                <div>
                  <label className="text-base font-medium text-slate-800">이름</label>
                  <Input className="mt-1" {...register("name")} />
                  {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name.message}</p> : null}
                </div>
                <div>
                  <label className="text-base font-medium text-slate-800">휴대폰 번호</label>
                  <Input
                    className="mt-1"
                    inputMode="numeric"
                    placeholder="예: 01012345678"
                    {...register("phone")}
                  />
                  {errors.phone ? <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p> : null}
                  <p className="mt-1 text-xs text-slate-500">숫자만 10~11자리로 입력해 주세요. 010 시작을 권장합니다.</p>
                </div>
                <div>
                  <label className="text-base font-medium text-slate-800">이메일</label>
                  <Input className="mt-1" type="email" {...register("email")} />
                  {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email.message}</p> : null}
                  <p className="mt-1 text-xs text-emerald-700">이메일 인증이 완료된 계정입니다.</p>
                </div>
                <Button type="button" className="w-full" size="lg" onClick={() => void goNextStep()}>
                  의뢰 정보 입력하기
                </Button>
              </>
            ) : (
              <>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  <p className="font-bold">본인 확인 완료</p>
                  <p className="mt-1">
                    {getValues("name")} · {getValues("phone")} · {getValues("email")}
                  </p>
                </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-base font-medium text-slate-800">연락처</label>
                <Input className="mt-1 bg-slate-50" readOnly value={getValues("phone")} />
              </div>
              <div>
                <label className="text-base font-medium text-slate-800">이메일</label>
                <Input className="mt-1 bg-slate-50" type="email" readOnly value={getValues("email")} />
              </div>
            </div>
            <div>
              <label className="text-base font-medium text-slate-800">업종 또는 활동 분야</label>
              <Input
                className="mt-1"
                placeholder="예: 인테리어, 미용, 프리랜서, 사업자 없음"
                {...register("business_type")}
              />
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
            </>
          )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
