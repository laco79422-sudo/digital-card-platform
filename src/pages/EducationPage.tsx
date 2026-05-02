import { EducationCourseCard } from "@/components/education/EducationCourseCard";
import { EducationSeo } from "@/components/education/EducationSeo";
import { linkButtonClassName } from "@/components/ui/buttonStyles";
import {
  EDUCATION_CATEGORY_LABEL,
  EDUCATION_CATEGORY_ORDER,
} from "@/lib/educationLabels";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { useAppDataStore } from "@/stores/appDataStore";
import type { EducationCategory } from "@/types/domain";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

export function EducationPage() {
  const offerings = useAppDataStore((s) => s.educationOfferings);
  const [tab, setTab] = useState<EducationCategory | "all">("all");

  const filtered = useMemo(() => {
    return offerings.filter((o) => {
      if (o.status === "draft") return false;
      if (tab !== "all" && o.category !== tab) return false;
      return true;
    });
  }, [offerings, tab]);

  return (
    <>
      <EducationSeo />
      <div className="pb-16">
        <section className="border-b border-slate-200 bg-gradient-to-b from-brand-50/70 to-white py-12 sm:py-16">
          <div className={cn(layout.page, "space-y-6")}>
            <div className="max-w-3xl space-y-3">
              <p className="text-sm font-semibold text-brand-800">교육·강사</p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                교육과 강사를 한곳에서
              </h1>
              <p className="text-base leading-relaxed text-slate-700 sm:text-lg">
                명함디자인, 블로그, 영상제작, 프로그램 제작, AI 제작교육까지 필요한 교육을 신청하고, 강사로도 지원할
                수 있습니다. 린코 명함부터 제작 교육까지 온라인과 오프라인으로 배울 수 있습니다. 강사로 활동하고
                싶다면 강사 신청도 가능합니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTab("all")}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition-colors",
                  tab === "all" ? "bg-brand-900 text-white ring-brand-900" : "bg-white text-slate-700 ring-slate-200",
                )}
              >
                전체
              </button>
              {EDUCATION_CATEGORY_ORDER.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setTab(c)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition-colors",
                    tab === c ? "bg-brand-900 text-white ring-brand-900" : "bg-white text-slate-700 ring-slate-200",
                  )}
                >
                  {EDUCATION_CATEGORY_LABEL[c]}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className={cn(layout.page, "py-10 sm:py-12")}>
          <h2 className="sr-only">교육 목록</h2>
          {filtered.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-slate-600">
              해당 조건의 교육이 없습니다. 다른 분야를 선택하거나 다음 모집을 기다려 주세요.
            </p>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((course) => (
                <li key={course.id}>
                  <EducationCourseCard course={course} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="border-t border-slate-200 bg-white py-14">
          <div className={cn(layout.page, "flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between")}>
            <div className="max-w-xl space-y-2">
              <h2 className="text-xl font-bold text-slate-900">강사로 함께하기</h2>
              <p className="text-sm leading-relaxed text-slate-600">
                내가 가진 경험과 기술로 린코 회원들에게 교육을 진행할 수 있습니다.
              </p>
              <p className="text-xs leading-relaxed text-slate-500">
                강사 신청 정보는 공개되지 않으며, 관리자 검토 후 선정된 강사만 교육을 운영할 수 있습니다.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Link
                to="/education/teacher-apply"
                className={cn(linkButtonClassName({ variant: "secondary", size: "lg" }), "min-h-[52px] sm:min-w-[200px]")}
              >
                강사로 신청하기
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
