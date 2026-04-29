import {
  INDUSTRY_TEMPLATE_LIST,
  type IndustryTemplateId,
  type IndustryTemplateRecord,
} from "@/data/industryTemplates";
import { REVENUE_TEMPLATE_LIST } from "@/data/revenueCardTemplates";
import { cn } from "@/lib/utils";
import { ArrowRight, Sparkles } from "lucide-react";

function emojiFor(id: IndustryTemplateId): string {
  return REVENUE_TEMPLATE_LIST.find((r) => r.id === id)?.emoji ?? "📇";
}

function RevenueMiniHint(rec: IndustryTemplateRecord): string {
  const rev = REVENUE_TEMPLATE_LIST.find((r) => r.id === rec.templateId);
  return rev?.hook ?? rec.headline;
}

export function IndustryPickSection({
  disabled,
  selectedId,
  onSelectIndustry,
  onQuickCreate,
  submitting,
}: {
  disabled?: boolean;
  selectedId: IndustryTemplateId | null;
  onSelectIndustry: (id: IndustryTemplateId) => void;
  onQuickCreate: () => void | Promise<void>;
  submitting?: boolean;
}) {
  return (
    <section
      className="rounded-2xl border border-cta-200/90 bg-gradient-to-br from-cta-50/95 via-white to-brand-50/70 p-4 shadow-sm ring-1 ring-slate-900/[0.04] sm:p-6"
      aria-label="업종 선택 — 자동 입력"
    >
      <div className="flex flex-wrap items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cta-500 text-white shadow-md shadow-cta-900/15">
          <Sparkles className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-cta-800">① 업종 선택</p>
          <h2 className="mt-1 text-lg font-extrabold leading-snug text-slate-900 sm:text-xl">
            업종만 선택하면 명함 내용이 자동으로 채워집니다
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-[15px]">
            이름·연락처는 나중에 고쳐도 됩니다. 같은 업종 템플릿으로 미리보기·버튼 구조가 한 번에 들어갑니다.
          </p>
        </div>
      </div>

      <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {INDUSTRY_TEMPLATE_LIST.map((row) => {
          const active = selectedId === row.templateId;
          const em = emojiFor(row.templateId);
          return (
            <li key={row.templateId}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelectIndustry(row.templateId)}
                className={cn(
                  "flex h-full min-h-[132px] w-full flex-col rounded-2xl border-2 px-4 py-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cta-500 focus-visible:ring-offset-2",
                  active
                    ? "border-cta-500 bg-white shadow-md shadow-cta-900/10 ring-1 ring-cta-400/40"
                    : "border-slate-200/90 bg-white/90 hover:border-cta-300 hover:bg-white hover:shadow-md",
                  disabled && "pointer-events-none opacity-60",
                )}
              >
                <span className="flex items-center gap-2 text-base font-extrabold text-slate-900">
                  <span aria-hidden>{em}</span>
                  {row.industry}
                </span>
                <span className="mt-1 text-xs font-semibold text-cta-800">{RevenueMiniHint(row)}</span>
                <span className="mt-2 text-[11px] font-medium leading-snug text-slate-500 sm:text-xs">
                  {row.headline}
                </span>
                <span className="mt-auto flex items-center gap-1 pt-3 text-sm font-bold text-cta-700">
                  {row.ctaText}
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 flex flex-col items-center gap-3 border-t border-slate-200/90 pt-6 sm:flex-row sm:justify-center">
        <button
          type="button"
          disabled={disabled || !selectedId || submitting}
          onClick={() => void onQuickCreate()}
          className={cn(
            "inline-flex min-h-[56px] w-full max-w-md items-center justify-center gap-2 rounded-xl px-6 text-base font-extrabold text-white shadow-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-400 focus-visible:ring-offset-2 sm:w-auto sm:min-w-[280px]",
            "bg-gradient-to-r from-cta-500 to-cta-600 shadow-cta-900/25 hover:from-cta-400 hover:to-cta-500 disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {submitting ? "저장 중…" : "3초 명함 만들기"}
          <ArrowRight className="h-5 w-5 shrink-0" aria-hidden />
        </button>
        {!selectedId ? (
          <p className="text-center text-sm font-medium text-slate-500">먼저 위에서 업종을 선택해 주세요.</p>
        ) : null}
      </div>
    </section>
  );
}
