import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { form } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { useAppDataStore } from "@/stores/appDataStore";
import type { EducationInterest } from "@/types/domain";
import { useState } from "react";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "이름을 입력해 주세요."),
  phone: z.string().min(1, "연락처를 입력해 주세요."),
  email: z.string().min(1, "이메일을 입력해 주세요.").email("이메일 형식을 확인해 주세요."),
  interest: z.enum(["blog", "video", "both"]),
  message: z.string().optional(),
});

export function EducationForm() {
  const addEducationApplication = useAppDataStore((s) => s.addEducationApplication);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [interest, setInterest] = useState<EducationInterest>("both");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = schema.safeParse({ name, phone, email, interest, message });
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors;
      setErrors({
        name: first.name?.[0],
        phone: first.phone?.[0],
        email: first.email?.[0],
        interest: first.interest?.[0],
      });
      return;
    }
    setLoading(true);
    try {
      addEducationApplication({
        id: crypto.randomUUID(),
        name: parsed.data.name.trim(),
        phone: parsed.data.phone.trim(),
        email: parsed.data.email.trim(),
        interest: parsed.data.interest,
        message: parsed.data.message?.trim() ?? "",
        created_at: new Date().toISOString(),
      });
      setSuccess(true);
      setName("");
      setPhone("");
      setEmail("");
      setInterest("both");
      setMessage("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="education-apply" className="scroll-mt-24 border-t border-slate-200 bg-white py-14 sm:py-16">
      <div className="mx-auto max-w-xl px-5 sm:px-6 lg:px-8">
        <Card className="border-slate-200 shadow-lg">
          <CardHeader>
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">교육 신청</h2>
            <p className="text-sm text-slate-600">신청 후 순차적으로 연락드립니다.</p>
          </CardHeader>
          <CardContent>
            {success ? (
              <div
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-900"
                role="status"
              >
                <p className="font-semibold">교육 신청이 접수되었습니다.</p>
                <p className="mt-1 text-sm leading-relaxed text-emerald-800/90">
                  입력하신 연락처로 안내드리겠습니다. (로컬 저장소에 기록되었습니다. 실서비스에서는 이메일·DB 연동을 권장합니다.)
                </p>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={onSubmit} noValidate>
                <div>
                  <label className="text-base font-medium text-slate-800" htmlFor="edu-name">
                    이름
                  </label>
                  <Input
                    id="edu-name"
                    className="mt-1"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                  {errors.name ? <p className="mt-1 text-sm text-red-600">{errors.name}</p> : null}
                </div>
                <div>
                  <label className="text-base font-medium text-slate-800" htmlFor="edu-phone">
                    연락처
                  </label>
                  <Input
                    id="edu-phone"
                    className="mt-1"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    inputMode="tel"
                    autoComplete="tel"
                  />
                  {errors.phone ? <p className="mt-1 text-sm text-red-600">{errors.phone}</p> : null}
                </div>
                <div>
                  <label className="text-base font-medium text-slate-800" htmlFor="edu-email">
                    이메일
                  </label>
                  <Input
                    id="edu-email"
                    type="email"
                    className="mt-1"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                  {errors.email ? <p className="mt-1 text-sm text-red-600">{errors.email}</p> : null}
                </div>
                <div>
                  <label className="text-base font-medium text-slate-800" htmlFor="edu-interest">
                    관심 분야
                  </label>
                  <Select
                    id="edu-interest"
                    className="mt-1"
                    value={interest}
                    onChange={(e) => setInterest(e.target.value as EducationInterest)}
                  >
                    <option value="blog">블로그</option>
                    <option value="video">영상</option>
                    <option value="both">둘 다</option>
                  </Select>
                </div>
                <div>
                  <label className="text-base font-medium text-slate-800" htmlFor="edu-msg">
                    문의 내용
                  </label>
                  <Textarea
                    id="edu-msg"
                    className={cn(form.textarea, "mt-1")}
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="희망 일정·질문을 남겨 주세요."
                  />
                </div>
                <Button type="submit" className="w-full min-h-[52px] text-base font-semibold sm:min-h-14" size="lg" loading={loading}>
                  교육 신청하기
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
