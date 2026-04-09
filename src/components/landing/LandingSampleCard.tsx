import { ExternalLink, MessageCircle, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  /** 히어로에서 더 크게·강조해서 표시 */
  variant?: "default" | "hero";
  className?: string;
};

/**
 * 랜딩용 미리보기 — 실제 샘플 편집 데이터와 같은 홍보·전환형 톤.
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
            "font-semibold uppercase tracking-[0.18em] text-brand-700",
            isHero ? "text-xs sm:text-sm" : "text-xs",
          )}
        >
          린코 디지털 명함
        </p>
        <p
          className={cn(
            "mt-3 font-extrabold leading-[1.2] tracking-tight text-slate-900",
            isHero ? "text-xl sm:text-2xl md:text-[1.65rem]" : "text-lg sm:text-xl",
          )}
        >
          명함 하나로 고객이 먼저 찾아오게 만듭니다
        </p>
        <p className={cn("mt-3 font-semibold text-slate-800", isHero ? "text-base" : "text-sm")}>
          송민호
        </p>
        <p className="mt-1 text-sm font-medium leading-snug text-slate-600">
          린코 디지털 명함 대표 · 연결을 만드는 사람
        </p>
        <p
          className={cn(
            "mt-4 leading-relaxed text-slate-700",
            isHero ? "text-[15px] sm:text-base" : "text-sm sm:text-[15px]",
          )}
        >
          홍보가 되는 명함,
          <br />
          연결이 이어지는 구조까지 함께 설계합니다
        </p>
      </div>
      <div className={cn("space-y-3", isHero ? "px-6 py-5 sm:px-8" : "px-5 py-4 sm:px-6")}>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <span
            className={cn(
              "inline-flex items-center justify-center rounded-xl bg-brand-800 font-bold text-white shadow-lg",
              isHero ? "min-h-12 px-4 text-sm sm:text-[15px]" : "min-h-11 px-3 text-sm",
            )}
          >
            내 명함 만들어보기
          </span>
          <span
            className={cn(
              "inline-flex items-center justify-center rounded-xl border-2 border-brand-600 bg-white font-bold text-brand-900 shadow-md",
              isHero ? "min-h-12 px-4 text-sm sm:text-[15px]" : "min-h-11 px-3 text-sm",
            )}
          >
            무료로 구조 받아보기
          </span>
        </div>
        <div className="flex flex-wrap gap-2 pt-0.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800">
            <Phone className="h-3.5 w-3.5 shrink-0 text-brand-700" aria-hidden />
            빠른 문의
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800">
            <MessageCircle className="h-3.5 w-3.5 shrink-0 text-brand-700" aria-hidden />
            카톡 상담
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800">
            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-brand-700" aria-hidden />
            샘플 더 보기
          </span>
        </div>
        <p className={cn("text-center text-slate-500", isHero ? "text-xs sm:text-sm" : "text-xs")}>
          위 예시는 편집 화면에서 그대로 수정·저장할 수 있어요.
        </p>
      </div>
    </div>
  );
}
