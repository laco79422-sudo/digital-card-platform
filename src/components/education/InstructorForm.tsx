import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { form } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { useAppDataStore } from "@/stores/appDataStore";
import { useState } from "react";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "이름을 입력해 주세요."),
  phone: z.string().min(1, "연락처를 입력해 주세요."),
  email: z.string().min(1, "이메일을 입력해 주세요.").email("이메일 형식을 확인해 주세요."),
  specialty: z.string().min(1, "전문 분야를 입력해 주세요."),
  lecture_topics: z.string().min(1, "강의 가능 내용을 입력해 주세요."),
  experience: z.string().min(1, "경력·경험을 입력해 주세요."),
  portfolio_url: z.string().url("URL 형식을 확인해 주세요.").or(z.literal("")),
});

export function InstructorForm() {
  const addInstructorApplication = useAppDataStore((s) => s.addInstructorApplication);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [lectureTopics, setLectureTopics] = useState("");
  const [experience, setExperience] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = schema.safeParse({
      name,
      phone,
      email,
      specialty,
      lecture_topics: lectureTopics,
      experience,
      portfolio_url: portfolioUrl.trim() || undefined,
    });
    if (!parsed.success) {
      const f = parsed.error.flatten().fieldErrors;
      setErrors({
        name: f.name?.[0],
        phone: f.phone?.[0],
        email: f.email?.[0],
        specialty: f.specialty?.[0],
        lecture_topics: f.lecture_topics?.[0],
        experience: f.experience?.[0],
      });
      return;
    }
    setLoading(true);
    try {
      addInstructorApplication({
        id: crypto.randomUUID(),
        name: parsed.data.name.trim(),
        phone: parsed.data.phone.trim(),
        email: parsed.data.email.trim(),
        specialty: parsed.data.specialty.trim(),
        lecture_topics: parsed.data.lecture_topics.trim(),
        experience: parsed.data.experience.trim(),
        portfolio_url: parsed.data.portfolio_url?.trim() ?? "",
        created_at: new Date().toISOString(),
      });
      setSuccess(true);
      setName("");
      setPhone("");
      setEmail("");
      setSpecialty("");
      setLectureTopics("");
      setExperience("");
      setPortfolioUrl("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="instructor-apply" className="scroll-mt-24 bg-slate-50 py-14 sm:py-16">
      <div className="mx-auto max-w-xl px-5 sm:px-6 lg:px-8">
        <Card className="border-slate-200 shadow-lg">
          <CardHeader>
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">강사 신청</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              자신의 경험과 노하우를 바탕으로
              <br />
              함께 성장할 강사를 모집합니다.
            </p>
          </CardHeader>
          <CardContent>
            {success ? (
              <div
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-900"
                role="status"
              >
                <p className="font-semibold">강사 지원이 접수되었습니다.</p>
                <p className="mt-1 text-sm leading-relaxed text-emerald-800/90">
                  검토 후 연락드립니다. (로컬 저장소에 기록되었습니다.)
                </p>
              </div>
            ) : (
              <form className="space-y-5" onSubmit={onSubmit} noValidate>
                <div>
                  <label className="text-base font-medium text-slate-800" htmlFor="ins-name">
                    이름
                  </label>
                  <Input
                    id="ins-name"
                    className="mt-1"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                  {errors.name ? <p className="mt-1 text-sm text-red-600">{errors.name}</p> : null}
                </div>
                <div>
                  <label className="text-base font-medium text-slate-800" htmlFor="ins-phone">
                    연락처
                  </label>
                  <Input
                    id="ins-phone"
                    className="mt-1"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    inputMode="tel"
                  />
                  {errors.phone ? <p className="mt-1 text-sm text-red-600">{errors.phone}</p> : null}
                </div>
                <div>
                  <label className="text-base font-medium text-slate-800" htmlFor="ins-email">
                    이메일
                  </label>
                  <Input
                    id="ins-email"
                    type="email"
                    className="mt-1"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                  {errors.email ? <p className="mt-1 text-sm text-red-600">{errors.email}</p> : null}
                </div>
                <div>
                  <label className="text-base font-medium text-slate-800" htmlFor="ins-spec">
                    전문 분야
                  </label>
                  <Input
                    id="ins-spec"
                    className="mt-1"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                  />
                  {errors.specialty ? <p className="mt-1 text-sm text-red-600">{errors.specialty}</p> : null}
                </div>
                <div>
                  <label className="text-base font-medium text-slate-800" htmlFor="ins-lec">
                    강의 가능 내용
                  </label>
                  <Textarea
                    id="ins-lec"
                    className={cn(form.textarea, "mt-1")}
                    rows={3}
                    value={lectureTopics}
                    onChange={(e) => setLectureTopics(e.target.value)}
                  />
                  {errors.lecture_topics ? (
                    <p className="mt-1 text-sm text-red-600">{errors.lecture_topics}</p>
                  ) : null}
                </div>
                <div>
                  <label className="text-base font-medium text-slate-800" htmlFor="ins-exp">
                    경력 / 경험
                  </label>
                  <Textarea
                    id="ins-exp"
                    className={cn(form.textarea, "mt-1")}
                    rows={4}
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                  />
                  {errors.experience ? <p className="mt-1 text-sm text-red-600">{errors.experience}</p> : null}
                </div>
                <div>
                  <label className="text-base font-medium text-slate-800" htmlFor="ins-port">
                    포트폴리오 링크
                  </label>
                  <Input
                    id="ins-port"
                    type="url"
                    className="mt-1"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://"
                  />
                </div>
                <Button type="submit" className="w-full min-h-[52px] text-base font-semibold sm:min-h-14" size="lg" loading={loading}>
                  강사 지원하기
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
