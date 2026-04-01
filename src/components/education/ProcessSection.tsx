import { layout } from "@/lib/ui-classes";
import { BookOpen, Clapperboard, GitBranch, Bot } from "lucide-react";

const STEPS = [
  { title: "AI 블로그 제작", desc: "주제·구조·초안까지 실무 흐름으로 글을 완성합니다.", icon: BookOpen },
  { title: "AI 영상 제작", desc: "기획·촬영·편집 워크플로를 영상 결과물로 연결합니다.", icon: Clapperboard },
  { title: "수익 구조 설계", desc: "유입·전환·단가를 맞춘 수익 모델을 직접 설계합니다.", icon: GitBranch },
  { title: "자동화 시스템 구축", desc: "반복 업무를 줄이고 운영 시간을 확보합니다.", icon: Bot },
];

export function ProcessSection() {
  return (
    <section className="border-b border-slate-200 bg-white py-14 sm:py-16" aria-labelledby="process-heading">
      <div className={layout.page}>
        <h2 id="process-heading" className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
          교육 과정
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-base text-slate-600">
          네 가지 축으로 실전 역량을 쌓고, 아래 신청으로 참여를 완료합니다.
        </p>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, idx) => (
            <li
              key={s.title}
              className="relative rounded-2xl border border-slate-200 bg-slate-50/90 p-5 shadow-sm"
            >
              <span className="text-xs font-bold text-brand-600">0{idx + 1}</span>
              <div className="mt-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
                <s.icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="mt-3 font-bold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
