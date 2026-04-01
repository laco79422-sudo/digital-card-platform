import { Button } from "@/components/ui/Button";

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** 모바일에서 하단 고정으로 유입 → 신청 전환 보조 */
export function CTASection() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/90 bg-white/95 px-3 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md md:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-lg gap-2">
        <Button
          type="button"
          className="min-h-[48px] flex-1 text-sm font-semibold"
          onClick={() => scrollToId("education-apply")}
        >
          교육 신청
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="min-h-[48px] flex-1 text-sm font-semibold"
          onClick={() => scrollToId("instructor-apply")}
        >
          강사 지원
        </Button>
      </div>
    </div>
  );
}
