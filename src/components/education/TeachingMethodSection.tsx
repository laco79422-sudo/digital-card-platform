import { layout } from "@/lib/ui-classes";
import { Check, Monitor, Users, Video } from "lucide-react";

const CHECKS = [
  "오프라인에서 직접 배우고",
  "온라인으로 반복하고",
  "실전으로 완성합니다",
];

const LIST = [
  { label: "오프라인 강의", icon: Users },
  { label: "온라인 강의", icon: Video },
  { label: "1:1 피드백", icon: Monitor },
];

export function TeachingMethodSection() {
  return (
    <section className="bg-slate-50 py-14 sm:py-16" aria-labelledby="method-heading">
      <div className={layout.page}>
        <h2 id="method-heading" className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
          교육 방식
        </h2>
        <ul className="mx-auto mt-8 max-w-2xl space-y-3">
          {CHECKS.map((t) => (
            <li key={t} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-800 shadow-sm">
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
              {t}
            </li>
          ))}
        </ul>
        <ul className="mt-10 grid gap-4 sm:grid-cols-3">
          {LIST.map((item) => (
            <li
              key={item.label}
              className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm"
            >
              <item.icon className="h-8 w-8 text-brand-700" aria-hidden />
              <span className="mt-3 font-semibold text-slate-900">{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
