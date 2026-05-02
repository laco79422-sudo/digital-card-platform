import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { EducationSeo } from "@/components/education/EducationSeo";
import {
  COURSE_ENROLLMENT_STATUS_LABEL,
  EDUCATION_CATEGORY_LABEL,
  EDUCATION_METHOD_LABEL,
  EDUCATION_OFFERING_STATUS_LABEL,
} from "@/lib/educationLabels";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { useAppDataStore } from "@/stores/appDataStore";
import { useAuthStore } from "@/stores/authStore";
import type { EducationApplication } from "@/types/domain";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

function formatCurrency(n: number) {
  return `₩${n.toLocaleString()}`;
}

export function EducationDetailPage() {
  const { id = "" } = useParams();
  const user = useAuthStore((s) => s.user);
  const offerings = useAppDataStore((s) => s.educationOfferings);
  const teachers = useAppDataStore((s) => s.teachers);
  const appendApplication = useAppDataStore((s) => s.addEducationApplication);

  const course = useMemo(() => offerings.find((x) => x.id === id), [offerings, id]);

  const teacherBio = useMemo(() => {
    if (!course?.teacher_id) return "";
    const t = teachers.find((x) => x.id === course.teacher_id);
    return t?.bio ?? "";
  }, [course, teachers]);

  const [name, setName] = useState(() => user?.name ?? "");
  const [phone, setPhone] = useState(() => user?.phone ?? "");
  const [email, setEmail] = useState(() => user?.email ?? "");
  const [method, setMethod] = useState<"online" | "offline">("online");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (!course) {
    return (
      <div className={cn(layout.pageCompact, "py-16 text-center")}>
        <p className="text-slate-600">교육을 찾을 수 없습니다.</p>
        <Link to="/education" className="mt-4 inline-block font-semibold text-brand-800">
          목록으로
        </Link>
      </div>
    );
  }

  const openApply = course.status === "open" && course.enrolling;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !email.trim()) return;
    const row: EducationApplication = {
      id: crypto.randomUUID(),
      education_id: course.id,
      user_id: user?.id ?? null,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      preferred_course_label: course.title,
      participation_method: method,
      message: message.trim(),
      status: "applied",
      created_at: new Date().toISOString(),
    };
    setBusy(true);
    try {
      appendApplication(row);
      setDone(true);
      window.requestAnimationFrame(() => {
        document.getElementById("education-apply")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <EducationSeo />
      <div className={cn(layout.pageForm, "space-y-10 py-10 sm:py-12")}>
        <Link to="/education" className="inline-flex min-h-10 text-sm font-semibold text-brand-800 hover:underline">
          ← 교육·강사 목록
        </Link>

        <header className="space-y-4 border-b border-slate-100 pb-8">
          <div className="flex flex-wrap gap-2">
            <Badge tone="brand">{EDUCATION_CATEGORY_LABEL[course.category]}</Badge>
            <Badge tone="default">{EDUCATION_METHOD_LABEL[course.method]}</Badge>
            <Badge tone={openApply ? "success" : "default"}>{EDUCATION_OFFERING_STATUS_LABEL[course.status]}</Badge>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">{course.title}</h1>
          <dl className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">교육 방식</dt>
              <dd className="font-semibold text-slate-900">{EDUCATION_METHOD_LABEL[course.method]}</dd>
            </div>
            <div>
              <dt className="text-slate-500">교육 시간</dt>
              <dd className="font-semibold text-slate-900">{course.schedule_summary}</dd>
            </div>
            <div>
              <dt className="text-slate-500">장소</dt>
              <dd className="font-semibold text-slate-900">{course.location}</dd>
            </div>
            <div>
              <dt className="text-slate-500">비용</dt>
              <dd className="font-bold text-brand-900">{formatCurrency(course.price)}</dd>
            </div>
          </dl>
        </header>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">강사 소개</h2>
          <p className="leading-relaxed text-slate-700">
            <span className="font-semibold text-slate-900">{course.teacher_display_name}</span>
            <br />
            {teacherBio || "강사 프로필이 등록되는 대로 더 자세한 소개를 확인할 수 있어요."}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">교육 내용</h2>
          <div className="whitespace-pre-wrap rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm leading-relaxed text-slate-800">
            {course.curriculum}
          </div>
          <div className="mt-4 space-y-1">
            <h3 className="text-base font-semibold text-slate-900">교육 소개</h3>
            <p className="leading-relaxed text-slate-700">{course.description}</p>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-slate-900">준비물</h2>
          <p className="leading-relaxed text-slate-700">{course.materials_needed}</p>
        </section>

        <section id="education-apply" className="scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold text-slate-900">교육 신청하기</h2>
          <p className="mt-1 text-sm text-slate-600">
            접수 후 상태는 신청 순으로 안내되며, 강사·운영 확인 단계에서 연락드릴 수 있습니다.
          </p>
          {done ? (
            <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900" role="status">
              교육 신청이 접수되었습니다. 안내를 위해 순차적으로 연락드릴 예정입니다.
            </p>
          ) : null}
          <form className="mt-6 max-w-lg space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="text-sm font-semibold text-slate-900">이름</label>
              <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} required disabled={done} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">연락처</label>
              <Input className="mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} required disabled={done} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">이메일</label>
              <Input className="mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={done} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">희망 교육</label>
              <Input className="mt-1" value={course.title} disabled readOnly />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900" htmlFor="participation-method">
                참여 방식
              </label>
              <Select
                id="participation-method"
                className="mt-1"
                value={method}
                onChange={(e) => setMethod(e.target.value as "online" | "offline")}
                disabled={done}
              >
                <option value="online">온라인</option>
                <option value="offline">오프라인</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-900">문의사항</label>
              <Textarea className="mt-1 min-h-[96px]" value={message} onChange={(e) => setMessage(e.target.value)} disabled={done} />
            </div>
            <p className="text-xs text-slate-500">신청 시 상태 초기값: {COURSE_ENROLLMENT_STATUS_LABEL.applied}</p>
            <Button type="submit" size="lg" className="w-full min-h-[52px]" disabled={busy || !openApply || done}>
              {openApply ? (busy ? "처리 중…" : "교육 신청하기") : "모집이 마감되었습니다"}
            </Button>
          </form>
        </section>
      </div>
    </>
  );
}
