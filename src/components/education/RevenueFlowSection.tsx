import { layout } from "@/lib/ui-classes";
import { ArrowRight } from "lucide-react";

const FLOWS = [
  {
    title: "블로그",
    steps: ["검색·SNS 유입", "체류·전환", "수익"],
    body: "키워드·콘텐츠 설계로 방문자를 모으고, 랜딩·제휴·문의로 매출로 연결하는 실제 파이프라인을 봅니다.",
  },
  {
    title: "영상",
    steps: ["노출·조회수", "구독·공유", "수익"],
    body: "알고리즘에 맞는 포맷과 훅으로 조회를 늘리고, 광고·후원·제안으로 수익 구조를 만듭니다.",
  },
];

export function RevenueFlowSection() {
  return (
    <section className="bg-slate-50 py-14 sm:py-16" aria-labelledby="revenue-heading">
      <div className={layout.page}>
        <h2 id="revenue-heading" className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
          수익 구조
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-base text-slate-600">
          이론이 아니라, 실제 흐름 중심으로 블로그와 영상 각각의 수익 경로를 이해합니다.
        </p>
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          {FLOWS.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
            >
              <h3 className="text-lg font-bold text-brand-900">{f.title}</h3>
              <p className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-800">
                {f.steps.map((s, i) => (
                  <span key={s} className="inline-flex items-center gap-2">
                    {i > 0 ? <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden /> : null}
                    <span className="rounded-full bg-brand-50 px-3 py-1.5 text-brand-900">{s}</span>
                  </span>
                ))}
              </p>
              <p className="mt-4 text-[15px] leading-relaxed text-slate-600 sm:text-base">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
