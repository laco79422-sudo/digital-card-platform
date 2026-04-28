import { CreatorCard } from "@/components/ui/CreatorCard";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { useAppDataStore } from "@/stores/appDataStore";
import type { CreatorType } from "@/types/domain";
import { useMemo, useState } from "react";

const tabs: { id: CreatorType | "all"; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "blog_writer", label: "블로그" },
  { id: "youtube_producer", label: "유튜브" },
  { id: "shortform_editor", label: "숏폼" },
  { id: "thumbnail_designer", label: "썸네일" },
];

const selectionSteps = [
  {
    title: "1단계. 필터 질문",
    label: "고객 관점 분석",
    body: "“이 명함을 보고 고객이 연락할까요? 그 이유를 설명해주세요.”",
    note: "예쁘다는 감상이 아니라, 고객이 왜 행동하는지 설명할 수 있는지 봅니다.",
  },
  {
    title: "2단계. 실전 테스트",
    label: "전환형 명함 제작",
    body: "직업: 암롤박스 도장 시공 / 목표: 전화 문의 유도 / 고객: 건설·현장 운영자",
    note: "명함 1개를 만들고, 1초 이해·연락 문장·CTA·구조 설계를 함께 평가합니다.",
  },
  {
    title: "3단계. 확장 질문",
    label: "마케팅 감각",
    body: "“이 명함을 더 많이 공유되게 만들려면?”",
    note: "명함을 만드는 능력에서 끝나지 않고 공유와 문의 증가까지 생각하는지 확인합니다.",
  },
] as const;

const evaluationItems = ["1초 이해 가능 여부", "연락 유도 문장", "CTA 명확성", "구조 설계"] as const;
const corePrinciples = ["디자인보다 전환율", "감성보다 행동 유도", "예쁨보다 문의"] as const;

export function CreatorDirectoryPage() {
  const creators = useAppDataStore((s) => s.creators);
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("all");

  const filtered = useMemo(() => {
    if (tab === "all") return creators;
    return creators.filter((c) => c.creator_type === tab);
  }, [creators, tab]);

  return (
    <div className={cn(layout.page, "py-10 sm:py-12")}>
      <h1 className="break-keep text-2xl font-bold leading-snug tracking-tight text-slate-900 md:text-3xl">
        Expert 둘러보기
      </h1>
      <p className="mt-2 text-base leading-relaxed text-slate-600">
        블로그·영상 Expert를 한곳에서 찾고, 프로필에서 바로 지원하세요.
      </p>

      <section className="mt-10 rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-slate-50 p-5 shadow-sm sm:p-7 lg:p-8">
        <div className="max-w-3xl">
          <p className="text-sm font-bold text-brand-800">디자이너 선발 기준</p>
          <h2 className="mt-2 break-keep text-2xl font-extrabold leading-snug tracking-tight text-slate-950 md:text-3xl">
            예쁜 디자인보다 연락이 오는 명함을 만드는 사람
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-700">
            린코는 보기 좋은 결과물보다 고객이 이해하고, 신뢰하고, 바로 문의하게 만드는 구조를 우선합니다.
          </p>
        </div>

        <div className="mt-7 grid gap-4 lg:grid-cols-3">
          {selectionSteps.map((step) => (
            <article key={step.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-700">{step.label}</p>
              <h3 className="mt-2 text-lg font-bold text-slate-950">{step.title}</h3>
              <p className="mt-3 whitespace-pre-line break-keep text-[15px] font-semibold leading-relaxed text-slate-900">
                {step.body}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{step.note}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950">실전 테스트 평가 기준</h3>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {evaluationItems.map((item) => (
                <li key={item} className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-900 bg-slate-950 p-5 text-white shadow-sm">
            <h3 className="text-lg font-bold">핵심 원칙</h3>
            <ul className="mt-4 space-y-2">
              {corePrinciples.map((item) => (
                <li key={item} className="rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-950">운영 역할</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="font-bold text-slate-900">Expert</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">시각 디자인과 완성도를 담당합니다.</p>
            </div>
            <div className="rounded-xl bg-brand-50 p-4">
              <p className="font-bold text-brand-950">설계자</p>
              <p className="mt-1 text-sm leading-relaxed text-brand-900">
                문장, CTA, 고객 행동 흐름을 설계합니다. 두 역할 모두 가능한 인재를 우선 선발합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-8 flex gap-2 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2.5 text-base font-medium transition-colors min-h-11",
              tab === t.id
                ? "bg-brand-900 text-white"
                : "bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <li key={c.id}>
            <CreatorCard creator={c} />
          </li>
        ))}
      </ul>
    </div>
  );
}
