import { ExternalLink, MessageCircle, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

export type LandingSampleType = "personal" | "business" | "store";

type Props = {
  /** 히어로에서 더 크게·강조해서 표시 */
  variant?: "default" | "hero";
  sampleType?: LandingSampleType;
  className?: string;
};

const SAMPLE_CARDS: Record<
  LandingSampleType,
  {
    typeLabel: string;
    name: string;
    role: string;
    tagline: string;
    description: string;
    initials: string;
    accent: string;
  }
> = {
  personal: {
    typeLabel: "개인형",
    name: "송민호",
    role: "린코 디지털 명함 대표",
    tagline: "연결을 만드는 사람",
    description: "홍보가 되는 명함,\n연결이 이어지는 구조까지 설계합니다",
    initials: "SM",
    accent: "from-brand-500 via-indigo-500 to-slate-900",
  },
  business: {
    typeLabel: "사업자형",
    name: "김하늘",
    role: "브랜드 컨설팅 대표",
    tagline: "고객 문의를 매출로 연결합니다",
    description: "서비스 소개부터 상담 신청까지,\n사업에 맞는 연결 흐름을 만듭니다",
    initials: "KH",
    accent: "from-emerald-500 via-teal-500 to-brand-700",
  },
  store: {
    typeLabel: "매장형",
    name: "오후공방",
    role: "핸드메이드 소품 매장",
    tagline: "방문 전부터 기억되는 매장",
    description: "위치, 예약, 이벤트 안내까지,\n손님이 바로 행동하게 설계합니다",
    initials: "OH",
    accent: "from-amber-400 via-orange-500 to-rose-500",
  },
};

/**
 * 랜딩용 미리보기 — 실제 샘플 편집 데이터와 같은 홍보·전환형 톤.
 */
export function LandingSampleCard({ variant = "default", sampleType = "personal", className }: Props) {
  const isHero = variant === "hero";
  const sample = SAMPLE_CARDS[sampleType];

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
      <div className={cn(isHero ? "p-5 sm:p-6" : "p-5")}>
        <div
          className={cn(
            "flex min-h-44 items-end overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white",
            sample.accent,
            isHero ? "sm:min-h-52 sm:p-6" : "",
          )}
          aria-label={`${sample.name} 프로필 이미지`}
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 text-2xl font-black tracking-tight shadow-lg ring-1 ring-white/30 backdrop-blur-sm">
            {sample.initials}
          </div>
        </div>

        <div className="mt-5">
          <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-800">
            {sample.typeLabel}
          </span>
          <h3 className={cn("mt-3 font-extrabold tracking-tight text-slate-950", isHero ? "text-2xl" : "text-xl")}>
            {sample.name}
          </h3>
          <p className="mt-1 text-sm font-semibold leading-snug text-slate-600">{sample.role}</p>
          <p className="mt-3 text-base font-bold leading-snug text-slate-900">{sample.tagline}</p>
          <p
            className={cn(
              "mt-4 whitespace-pre-line leading-relaxed text-slate-700",
              isHero ? "text-[15px] sm:text-base" : "text-sm sm:text-[15px]",
            )}
          >
            {sample.description}
          </p>
        </div>
      </div>
      <div className={cn("space-y-3", isHero ? "px-6 py-5 sm:px-8" : "px-5 py-4 sm:px-6")}>
        <span
          className={cn(
            "inline-flex w-full items-center justify-center rounded-xl bg-cta-500 font-bold text-white shadow-lg shadow-cta-900/20 hover:bg-cta-600",
            isHero ? "min-h-12 px-4 text-sm sm:text-[15px]" : "min-h-11 px-3 text-sm",
          )}
        >
          문의하기
        </span>
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
            샘플 보기
          </span>
        </div>
        <p className={cn("text-center text-slate-500", isHero ? "text-xs sm:text-sm" : "text-xs")}>
          빠른 문의, 카톡 상담, 샘플 보기는 명함 안에서 바로 연결됩니다.
        </p>
      </div>
    </div>
  );
}
