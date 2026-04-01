import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { TrendingUp, Eye } from "lucide-react";

const CASES = [
  {
    title: "블로그 수익 사례",
    desc: "SEO 롱폼과 내부 링크 구조로 유입을 쌓고, 제휴·리드 전환으로 월 수익 곡선을 만든 실제 흐름을 다룹니다.",
    image:
      "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&q=80",
    icon: TrendingUp,
  },
  {
    title: "AI 영상 조회수 사례",
    desc: "썸네일·훅·자막을 데이터로 다듬어 조회수와 체류를 동시에 끌어올린 케이스를 공유합니다.",
    image:
      "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&q=80",
    icon: Eye,
  },
];

export function CaseSection() {
  return (
    <section className="border-b border-slate-200 bg-white py-14 sm:py-16" aria-labelledby="case-heading">
      <div className={layout.page}>
        <h2 id="case-heading" className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
          실제 사례
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-base text-slate-600">
          유입과 수익이 연결되는 현장 중심 사례로 신뢰를 쌓은 뒤, 아래에서 교육·강사 신청으로 이어집니다.
        </p>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:gap-8">
          {CASES.map((c) => (
            <li
              key={c.title}
              className={cn(
                "overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/80 shadow-sm",
                "transition-shadow hover:shadow-md",
              )}
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-200">
                <img
                  src={c.image}
                  alt=""
                  className="h-full w-full object-cover object-center"
                  loading="lazy"
                />
                <div className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 text-brand-800 shadow">
                  <c.icon className="h-5 w-5" aria-hidden />
                </div>
              </div>
              <div className="p-5 sm:p-6">
                <h3 className="text-lg font-bold text-slate-900">{c.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-slate-600 sm:text-base">{c.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
