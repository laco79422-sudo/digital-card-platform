import {
  REVENUE_TEMPLATE_LIST,
  type RevenueCardTemplateId,
} from "@/data/revenueCardTemplates";
import { cn } from "@/lib/utils";
import { ArrowRight, Sparkles } from "lucide-react";

export function RevenueTemplateSection({
  disabled,
  selectedId,
  onSelectTemplate,
}: {
  disabled?: boolean;
  selectedId: RevenueCardTemplateId | null;
  onSelectTemplate: (id: RevenueCardTemplateId) => void;
}) {
  return (
    <section
      className="rounded-2xl border border-cta-200/90 bg-gradient-to-br from-cta-50/95 via-white to-brand-50/70 p-4 shadow-sm ring-1 ring-slate-900/[0.04] sm:p-6"
      aria-label="업종 선택 및 명함 템플릿"
    >
      <div className="flex flex-wrap items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cta-500 text-white shadow-md shadow-cta-900/15">
          <Sparkles className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-cta-800">① 업종 선택</p>
          <h2 className="mt-1 text-lg font-extrabold leading-snug text-slate-900 sm:text-xl">
            업종만 고르면 템플릿이 자동 적용됩니다
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-[15px]">
            미리 구성된 문구·버튼 구조가 한 번에 들어갑니다. 아래에서 이름과 연락처만 바꿔도 바로 공유할 수 있어요.
          </p>
        </div>
      </div>

      <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {REVENUE_TEMPLATE_LIST.map((item) => {
          const active = selectedId === item.id;
          return (
            <li key={item.id}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelectTemplate(item.id)}
                className={cn(
                  "flex h-full min-h-[132px] w-full flex-col rounded-2xl border-2 px-4 py-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cta-500 focus-visible:ring-offset-2",
                  active
                    ? "border-cta-500 bg-white shadow-md shadow-cta-900/10 ring-1 ring-cta-400/40"
                    : "border-slate-200/90 bg-white/90 hover:border-cta-300 hover:bg-white hover:shadow-md",
                  disabled && "pointer-events-none opacity-60",
                )}
              >
                <span className="flex items-center gap-2 text-base font-extrabold text-slate-900">
                  <span aria-hidden>{item.emoji}</span>
                  {item.label}
                </span>
                <span className="mt-1 text-xs font-semibold text-cta-800">{item.hook}</span>
                <span className="mt-2 text-[11px] font-medium leading-snug text-slate-500 sm:text-xs">
                  {item.bullets.join(" · ")}
                </span>
                <span className="mt-auto flex items-center gap-1 pt-3 text-sm font-bold text-cta-700">
                  {item.primaryCta}
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
