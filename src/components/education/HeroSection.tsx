import { Button } from "@/components/ui/Button";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function HeroSection() {
  return (
    <section
      className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-brand-950 to-brand-900 text-white"
      aria-label="교육신청 소개"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(96,165,250,0.2),_transparent_55%)]" />
      <div className={cn(layout.page, "relative py-14 sm:py-20 lg:py-24")}>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-brand-200/90">교육신청</p>
          <h1 className="mt-4 break-keep text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl">
            AI 블로그 · AI 영상 실전 교육
          </h1>
          <p className="mx-auto mt-6 max-w-2xl whitespace-pre-line text-base leading-relaxed text-white/92 sm:text-lg">
            배우는 것이 아니라, 만들어내는 교육{"\n"}
            AI 블로그와 AI 영상을 통해{"\n"}
            수익이 발생하는 구조를 직접 설계하고 실행합니다.
          </p>
          <div className="mt-10 flex w-full flex-col gap-3 sm:mx-auto sm:max-w-xl sm:flex-row sm:justify-center">
            <Button
              type="button"
              className="min-h-[52px] w-full border-0 bg-white text-base font-semibold text-slate-900 shadow-lg hover:bg-white/95 sm:min-h-14 sm:flex-1 sm:text-lg"
              onClick={() => scrollToId("education-apply")}
            >
              교육 신청하기
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="min-h-[52px] w-full border border-white/40 bg-white/10 text-base font-semibold text-white backdrop-blur hover:bg-white/20 sm:min-h-14 sm:flex-1 sm:text-lg"
              onClick={() => scrollToId("instructor-apply")}
            >
              강사 지원하기
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
