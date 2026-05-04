import {
  INDUSTRY_TEMPLATE_LIST,
  LINKO_MEMBER_INDUSTRY_LIST,
  RECOMMENDED_INDUSTRY_TEMPLATE_IDS,
  type IndustryTemplateId,
  type IndustryTemplateRecord,
} from "@/data/industryTemplates";
import { REVENUE_TEMPLATE_LIST } from "@/data/revenueCardTemplates";
import { cn } from "@/lib/utils";
import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type IndustryTabId = "recommended" | "general" | "linko";

function emojiFor(id: IndustryTemplateId): string {
  return REVENUE_TEMPLATE_LIST.find((r) => r.id === id)?.emoji ?? "📇";
}

function RevenueMiniHint(rec: IndustryTemplateRecord): string {
  const rev = REVENUE_TEMPLATE_LIST.find((r) => r.id === rec.templateId);
  return rev?.hook ?? rec.headline;
}

const recommendedSet = new Set<string>(RECOMMENDED_INDUSTRY_TEMPLATE_IDS);

const GENERAL_INDUSTRY_LIST = INDUSTRY_TEMPLATE_LIST.filter((r) => !recommendedSet.has(r.templateId));

const RECOMMENDED_LIST = RECOMMENDED_INDUSTRY_TEMPLATE_IDS.map((id) =>
  INDUSTRY_TEMPLATE_LIST.find((r) => r.templateId === id),
).filter((r): r is IndustryTemplateRecord => Boolean(r));

const TABS: { id: IndustryTabId; label: string }[] = [
  { id: "recommended", label: "추천 업종" },
  { id: "general", label: "일반 업종" },
  { id: "linko", label: "린코 소속" },
];

export function IndustryPickSection({
  disabled,
  selectedId,
  onSelectIndustry,
  onQuickCreate,
  submitting,
  onInstantSample,
  instantSampleBusy,
}: {
  disabled?: boolean;
  selectedId: IndustryTemplateId | null;
  onSelectIndustry: (id: IndustryTemplateId) => void;
  onQuickCreate: () => void | Promise<void>;
  submitting?: boolean;
  /** 한 번 탭하면 업종·문구·버튼까지 즉시 채움 (미선택 시 기본 업종 예시) */
  onInstantSample?: () => void | Promise<void>;
  instantSampleBusy?: boolean;
}) {
  const [tab, setTab] = useState<IndustryTabId>("recommended");

  useEffect(() => {
    if (!selectedId) return;
    const isLinko = LINKO_MEMBER_INDUSTRY_LIST.some((r) => r.templateId === selectedId);
    if (isLinko) {
      setTab("linko");
      return;
    }
    setTab(recommendedSet.has(selectedId) ? "recommended" : "general");
  }, [selectedId]);

  const rows = useMemo(() => {
    if (tab === "recommended") return RECOMMENDED_LIST;
    if (tab === "general") return GENERAL_INDUSTRY_LIST;
    return LINKO_MEMBER_INDUSTRY_LIST;
  }, [tab]);

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
            내 일을 가장 잘 설명하는 분야를 선택해 주세요. 선택한 분야에 맞춰 명함 문구가 자동으로 채워집니다.
          </p>
        </div>
      </div>

      {onInstantSample ? (
        <div className="mt-6 rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/90 to-white px-4 py-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:px-5">
          <div className="min-w-0">
            <p className="text-sm font-bold text-emerald-950">먼저 완성된 예시를 보고 수정만 하세요</p>
            <p className="mt-1 text-xs font-medium leading-relaxed text-emerald-900/90 sm:text-[13px]">
              업종을 고른 뒤 눌러 주면 그 업종 기준 전체 명함이 한 번에 들어옵니다. 미선택이면 인테리어 예시로 채워집니다.
            </p>
          </div>
          <button
            type="button"
            disabled={disabled || submitting || Boolean(instantSampleBusy)}
            onClick={() => void onInstantSample()}
            className={cn(
              "mt-4 inline-flex min-h-[48px] w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-extrabold text-white shadow-md shadow-emerald-900/25 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-55 sm:mt-0 sm:w-auto sm:min-w-[11rem]",
            )}
          >
            <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
            {instantSampleBusy ? "채우는 중…" : "샘플로 채우기"}
          </button>
        </div>
      ) : null}

      <div
        role="tablist"
        aria-label="업종 그룹"
        className="mt-5 flex flex-wrap gap-2 border-b border-slate-200/90 pb-3"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            disabled={disabled}
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-500 focus-visible:ring-offset-2",
              tab === t.id
                ? "bg-cta-500 text-white shadow-md shadow-cta-900/20"
                : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50",
              disabled && "pointer-events-none opacity-50",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "linko" ? (
        <div className="mt-4 rounded-xl border border-brand-200/80 bg-brand-50/60 px-3 py-2.5 text-sm leading-relaxed text-brand-950">
          <span className="font-bold">린코 소속 안내:</span> 린코에서 활동하는 전문가, 파트너, 강사도 자신의 역할에
          맞는 명함을 만들 수 있습니다.
        </div>
      ) : null}

      <ul
        className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
        role="tabpanel"
        aria-label={tab === "linko" ? "린코 소속 카드" : tab === "general" ? "일반 업종 카드" : "추천 업종 카드"}
      >
        {rows.map((row) => {
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
                  {tab === "linko" ? row.title : row.industry}
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

      <div className="mt-8 flex flex-col items-center gap-3 border-t border-slate-200/90 pt-6 sm:flex-row sm:justify-center sm:gap-4">
        <button
          type="button"
          disabled={disabled || !selectedId || submitting}
          onClick={() => void onQuickCreate()}
          className={cn(
            "inline-flex min-h-[56px] w-full max-w-md items-center justify-center gap-2 rounded-xl px-6 text-base font-extrabold text-white shadow-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-400 focus-visible:ring-offset-2 sm:w-auto sm:min-w-[280px]",
            "bg-gradient-to-r from-cta-500 to-cta-600 shadow-cta-900/25 hover:from-cta-400 hover:to-cta-500 disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {submitting ? "저장 중…" : "3초 명함 만들기 →"}
          {!submitting ? <ArrowRight className="h-5 w-5 shrink-0" aria-hidden /> : null}
        </button>
        {!selectedId ? (
          <p className="text-center text-sm font-medium text-slate-500 sm:text-left">
            먼저 위에서 업종을 선택해 주세요.
          </p>
        ) : null}
      </div>
    </section>
  );
}
