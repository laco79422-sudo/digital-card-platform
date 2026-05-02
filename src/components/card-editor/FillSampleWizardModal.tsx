import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  SAMPLE_BUSINESS_CATEGORIES,
  SAMPLE_PERSONAL_CATEGORIES,
  SAMPLE_STORE_CATEGORIES,
  phrasesFor,
  type CategoryOption,
  type SampleFlowKind,
  type SamplePhrase,
  type SampleSubcategoryId,
} from "@/data/cardSampleTemplates";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

export type FillSampleWizardResult = {
  kind: SampleFlowKind;
  subcategoryId: SampleSubcategoryId;
  phrase: SamplePhrase;
  categoryLabel: string;
  industryLabel: string;
};

const KIND_ROWS: { id: SampleFlowKind; title: string; hint: string }[] = [
  { id: "personal", title: "개인형", hint: "강사 · 프리랜서 · 크리에이터 등" },
  { id: "business", title: "사업자형", hint: "인테리어 · 뷰티 · 교육 등 업종" },
  { id: "store", title: "매장형", hint: "카페 · 식당 · 동네 매장" },
];

function subOptionsFor(kind: SampleFlowKind): CategoryOption[] {
  if (kind === "personal") return SAMPLE_PERSONAL_CATEGORIES;
  if (kind === "business") return SAMPLE_BUSINESS_CATEGORIES;
  return SAMPLE_STORE_CATEGORIES;
}

export function FillSampleWizardModal({
  open,
  onClose,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  onApply: (payload: FillSampleWizardResult) => void;
}) {
  const [kind, setKind] = useState<SampleFlowKind | null>(null);
  const [subId, setSubId] = useState<SampleSubcategoryId | null>(null);

  useEffect(() => {
    if (!open) return;
    setKind(null);
    setSubId(null);
  }, [open]);

  const subs = kind ? subOptionsFor(kind) : [];
  const phrases = useMemo(() => {
    if (!kind || !subId) return [];
    return phrasesFor(kind, subId);
  }, [kind, subId]);

  const pickKind = (k: SampleFlowKind) => {
    setKind(k);
    setSubId(null);
  };

  const pickSub = (id: SampleSubcategoryId) => {
    setSubId(id);
  };

  const industryLabel = useMemo(() => {
    if (!kind || !subId) return "";
    if (kind === "personal") return subs.find((s) => s.id === subId)?.label ?? "개인";
    if (kind === "business") return SAMPLE_BUSINESS_CATEGORIES.find((s) => s.id === subId)?.label ?? "사업";
    return SAMPLE_STORE_CATEGORIES.find((s) => s.id === subId)?.label ?? "매장";
  }, [kind, subId, subs]);

  const categoryLabelForApply = subs.find((s) => s.id === subId)?.label ?? "";

  return (
    <Modal open={open} onClose={onClose} title="어떤 명함을 만들까요?" className="max-w-xl">
      <p className="mb-6 text-[15px] leading-relaxed text-slate-600">
        유형과 세부 항목을 고르면, 그에 맞는 문장이 자동으로 들어갑니다. 적용 후에는 자유롭게 수정하셔도 됩니다.
      </p>

      {!kind ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {KIND_ROWS.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => pickKind(row.id)}
              className={cn(
                "flex flex-col items-start rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-brand-400 hover:bg-brand-50/40",
              )}
            >
              <span className="text-base font-bold text-slate-900">{row.title}</span>
              <span className="mt-2 text-xs font-medium leading-snug text-slate-600">{row.hint}</span>
            </button>
          ))}
        </div>
      ) : !subId ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setKind(null)}>
              ← 유형
            </Button>
            <span className="text-sm font-semibold text-slate-700">
              {kind === "personal" ? "세부 유형 선택" : kind === "business" ? "업종 선택" : "매장 유형 선택"}
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {subs.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => pickSub(s.id)}
                className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-left text-sm font-semibold text-slate-900 transition hover:border-brand-400 hover:bg-white"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setSubId(null)}>
              ← {kind === "personal" ? "세부 유형" : kind === "business" ? "업종" : "매장 유형"}
            </Button>
            <span className="text-sm font-semibold text-slate-800">{categoryLabelForApply} · 문구 선택</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-500">
            톤이 가장 가까운 문장을 하나만 고르세요. 선택 즉시 명함 초안에 반영됩니다.
          </p>
          <ul className="max-h-[min(52vh,420px)] space-y-2 overflow-y-auto pr-1">
            {phrases.map((phrase, idx) => (
              <li key={`${subId}-${idx}`}>
                <button
                  type="button"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-brand-500 hover:ring-1 hover:ring-brand-200"
                  onClick={() =>
                    onApply({
                      kind,
                      subcategoryId: subId,
                      phrase,
                      categoryLabel: categoryLabelForApply,
                      industryLabel,
                    })
                  }
                >
                  <p className="text-[11px] font-bold uppercase tracking-wide text-brand-800/90">{phrase.listLabel}</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{phrase.marketingTitle}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{phrase.tagline}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  );
}
