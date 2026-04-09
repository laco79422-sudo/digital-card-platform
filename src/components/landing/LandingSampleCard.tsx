import { MessageCircle, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  /** 히어로에서 더 크게·강조해서 표시 */
  variant?: "default" | "hero";
  className?: string;
};

/**
 * 마켓/외주 카드가 아닌 **디지털 명함** 샘플.
 * 링크 이동 없이 시각적 예시만 제공합니다.
 * 샘플 시작 시 자동 채워지는 예시와 톤을 맞춥니다.
 */
export function LandingSampleCard({ variant = "default", className }: Props) {
  const isHero = variant === "hero";

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-2xl border text-left text-slate-900 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.45)]",
        isHero
          ? "max-w-lg border-white/30 bg-white shadow-[0_28px_70px_-14px_rgba(0,0,0,0.55)] ring-1 ring-white/20"
          : "max-w-full border-white/25 bg-white/95",
        className,
      )}
    >
      <div
        className={cn(
          "border-b border-slate-200/90 bg-gradient-to-br from-brand-50 to-white",
          isHero ? "px-6 py-6 sm:px-8 sm:py-8" : "px-5 py-5 sm:px-6 sm:py-6",
        )}
      >
        <p
          className={cn(
            "font-semibold uppercase tracking-wider text-brand-700",
            isHero ? "text-sm" : "text-xs",
          )}
        >
          디지털 명함
        </p>
        <h3
          className={cn(
            "font-bold tracking-tight text-slate-900",
            isHero ? "mt-3 text-2xl sm:text-[1.75rem]" : "mt-2 text-2xl sm:text-[1.65rem]",
          )}
        >
          린코 스튜디오
        </h3>
        <p className={cn("font-medium text-slate-700", isHero ? "mt-2 text-base" : "mt-1.5 text-sm")}>
          송민호 · 디지털 명함 디자이너
        </p>
        <p
          className={cn(
            "leading-relaxed text-slate-700",
            isHero ? "mt-5 text-[15px] sm:text-base" : "mt-4 text-[15px] sm:text-base",
          )}
        >
          링크 하나로 나를 소개하고
          <br className="sm:hidden" /> 고객과 연결되는 디지털 명함을 만듭니다.
        </p>
      </div>
      <div className={cn("space-y-2.5", isHero ? "px-6 py-5 sm:px-8" : "px-5 py-4 sm:px-6")}>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <span
            className={cn(
              "inline-flex items-center justify-center rounded-xl bg-brand-800 font-semibold text-white shadow-sm",
              isHero ? "min-h-12 px-4 text-sm sm:text-[15px]" : "min-h-11 px-3 text-sm",
            )}
          >
            웹사이트
          </span>
          <span
            className={cn(
              "inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white font-semibold text-slate-800",
              isHero ? "min-h-12 px-4 text-sm sm:text-[15px]" : "min-h-11 px-3 text-sm",
            )}
          >
            상담하기
          </span>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
            <Phone className="h-3.5 w-3.5 shrink-0 text-brand-700" aria-hidden />
            전화
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
            <MessageCircle className="h-3.5 w-3.5 shrink-0 text-brand-700" aria-hidden />
            카카오톡
          </span>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
            링크
          </span>
        </div>
        <p className={cn("text-center text-slate-500", isHero ? "pt-1 text-xs sm:text-sm" : "pt-2 text-xs")}>
          실제 편집 화면에서는 색·버튼·링크를 자유롭게 바꿀 수 있어요.
        </p>
      </div>
    </div>
  );
}
