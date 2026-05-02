import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { linkButtonClassName } from "@/components/ui/buttonStyles";
import {
  EDUCATION_CATEGORY_LABEL,
  EDUCATION_METHOD_LABEL,
  EDUCATION_OFFERING_STATUS_LABEL,
} from "@/lib/educationLabels";
import { cn } from "@/lib/utils";
import type { EducationOffering } from "@/types/domain";
import { Link } from "react-router-dom";

function formatCurrency(n: number) {
  return `₩${n.toLocaleString()}`;
}

export function EducationCourseCard({ course }: { course: EducationOffering }) {
  const open = course.status === "open" && course.enrolling;

  return (
    <Card className="flex h-full flex-col border-slate-200 shadow-sm transition hover:border-brand-200 hover:shadow-md">
      <CardContent className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap gap-2">
          <Badge tone="brand">{EDUCATION_CATEGORY_LABEL[course.category]}</Badge>
          <Badge tone="default">{EDUCATION_METHOD_LABEL[course.method]}</Badge>
          <Badge tone={open ? "success" : "default"}>{EDUCATION_OFFERING_STATUS_LABEL[course.status]}</Badge>
        </div>
        <h3 className="text-lg font-bold leading-snug text-slate-900">{course.title}</h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">{course.description}</p>
        <dl className="grid gap-1.5 text-sm text-slate-700">
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">교육 시간</dt>
            <dd className="text-right font-medium text-slate-900">{course.schedule_summary}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">장소</dt>
            <dd className="text-right font-medium text-slate-900">{course.location}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">비용</dt>
            <dd className="text-right font-bold text-brand-900">{formatCurrency(course.price)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">강사</dt>
            <dd className="text-right font-medium text-slate-900">{course.teacher_display_name}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">모집 인원</dt>
            <dd className="text-right font-medium text-slate-900">{course.max_students}명</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">신청</dt>
            <dd className="text-right font-semibold">{open ? "가능" : "마감"}</dd>
          </div>
        </dl>
        <div className="mt-auto flex flex-wrap gap-2 pt-3">
          <Link
            to={`/education/${course.id}`}
            className={cn(linkButtonClassName({ variant: "secondary", size: "lg" }), "flex-1 min-h-[48px] text-center")}
          >
            자세히 보기
          </Link>
          <Link
            to={`/education/${course.id}#education-apply`}
            className={cn(
              linkButtonClassName({ size: "lg" }),
              "flex-1 min-h-[48px] text-center",
              !open && "pointer-events-none opacity-40",
            )}
            aria-disabled={!open}
            onClick={(e) => {
              if (!open) e.preventDefault();
            }}
          >
            교육 신청하기
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
