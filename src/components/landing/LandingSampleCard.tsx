import { cn } from "@/lib/utils";
import { Nfc, QrCode } from "lucide-react";

export type LandingSampleType = "personal" | "business" | "store";

type Props = {
  variant?: "default" | "hero";
  sampleType?: LandingSampleType;
  className?: string;
};

type SampleFeature = { text: string; title?: string };

type SampleConfig = {
  typeLabel: string;
  topBadges: string[];
  heroBrandLine: string;
  name: string;
  role: string;
  tagline: string;
  description: string;
  ctaLabel: string;
  accent: string;
  accentOverlay: string;
  bottomFeatures: SampleFeature[];
};

const SAMPLE_CARDS: Record<LandingSampleType, SampleConfig> = {
  personal: {
    typeLabel: "개인형",
    topBadges: ["현장 상담", "도면 제안", "직영 시공"],
    heroBrandLine: "INTERIOR STUDIO",
    name: "김민수",
    role: "인테리어 디렉터",
    tagline: "공간을 바꾸면 삶이 바뀝니다",
    description: "상담부터 시공까지 직접 연결해드립니다.",
    ctaLabel: "문의하기",
    accent: "from-violet-600 via-brand-600 to-indigo-950",
    accentOverlay:
      "bg-[radial-gradient(ellipse_85%_65%_at_50%_-10%,rgba(255,255,255,0.28),transparent_55%),radial-gradient(ellipse_70%_50%_at_100%_100%,rgba(99,102,241,0.35),transparent)]",
    bottomFeatures: [
      { text: "NFC 터치", title: "가까이 대면 바로 명함이 열립니다" },
      { text: "QR 스캔", title: "카메라로 스캔하면 바로 연결됩니다" },
      { text: "링크 공유", title: "링크를 받은 사람도 같은 명함으로 연결됩니다" },
    ],
  },
  business: {
    typeLabel: "사업자형",
    topBadges: ["퍼포먼스", "콘텐츠 기획", "상담 예약"],
    heroBrandLine: "BRAND MARKETER",
    name: "최유진",
    role: "프리랜서 마케터",
    tagline: "고객이 먼저 찾아오게 만듭니다",
    description: "블로그·영상 제안부터 문의 버튼까지 한 명함에서 마무리합니다.",
    ctaLabel: "상담 연결하기",
    accent: "from-emerald-600 via-teal-700 to-slate-950",
    accentOverlay:
      "bg-[radial-gradient(ellipse_90%_55%_at_30%_0%,rgba(52,211,153,0.35),transparent_50%),radial-gradient(ellipse_60%_45%_at_100%_80%,rgba(15,118,110,0.4),transparent)]",
    bottomFeatures: [
      { text: "QR 다운로드", title: "명함 QR을 저장해 오프라인에도 활용할 수 있어요" },
      { text: "NFC 카드", title: "태그 한 번으로 홍보 페이지로 연결됩니다" },
      { text: "홍보 링크", title: "추적 가능한 전용 링크로 홍보 성과를 확인합니다" },
    ],
  },
  store: {
    typeLabel: "매장형",
    topBadges: ["예약 안내", "시즌 메뉴", "포장 가능"],
    heroBrandLine: "LOCAL CAFE",
    name: "박도현",
    role: "카페 운영자",
    tagline: "방문 전 메뉴와 위치를 한 번에 확인하세요",
    description: "오시는 길, 단체 예약, 포장 문의도 여기서 바로 받습니다.",
    ctaLabel: "매장 보기",
    accent: "from-amber-500 via-orange-600 to-rose-950",
    accentOverlay:
      "bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(253,230,138,0.45),transparent_55%),radial-gradient(ellipse_55%_50%_at_0%_100%,rgba(244,63,94,0.25),transparent)]",
    bottomFeatures: [
      { text: "QR 안내판", title: "매장 입구·테이블 QR로 바로 연결됩니다" },
      { text: "NFC 스티커", title: "스티커를 태그하면 같은 명함으로 이동합니다" },
      { text: "위치 연결", title: "지도·길찾기까지 한 화면에서 안내합니다" },
    ],
  },
};

function SampleHeroVisual({
  heroBrandLine,
  centerName,
  accent,
  accentOverlay,
  isHero,
}: {
  heroBrandLine: string;
  centerName: string;
  accent: string;
  accentOverlay: string;
  isHero: boolean;
}) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-2xl bg-gradient-to-br shadow-inner ring-1 ring-white/15",
        accent,
        isHero ? "min-h-[11.5rem] sm:min-h-[13rem]" : "min-h-[10.5rem] sm:min-h-[12rem]",
      )}
      role="img"
      aria-label={`${centerName} 샘플 명함 미리보기`}
    >
      <div className={cn("pointer-events-none absolute inset-0 opacity-[0.88]", accentOverlay)} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-white/[0.07]" />
      <div className="relative flex h-full min-h-[inherit] flex-col justify-between p-4 sm:p-5">
        <p className="text-center font-semibold uppercase tracking-[0.35em] text-[10px] text-white/85 drop-shadow-sm sm:text-[11px]">
          {heroBrandLine}
        </p>
        <div className="flex flex-1 flex-col items-center justify-center px-2 pb-1 pt-2">
          <div className="max-w-[92%] rounded-2xl bg-white/15 px-3 py-2 text-center shadow-lg ring-1 ring-white/25 backdrop-blur-md sm:px-4">
            <span
              className={cn(
                "inline-block font-black tracking-tight text-white drop-shadow-md",
                centerName.length > 6 ? "text-sm sm:text-base" : "text-lg sm:text-xl",
              )}
            >
              {centerName}
            </span>
          </div>
        </div>
        <div className="flex items-end justify-between gap-3">
          <span
            title="NFC로 빠르게 연결됩니다"
            className="inline-flex items-center gap-1.5 rounded-lg bg-black/25 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-md ring-1 ring-white/25 backdrop-blur-md sm:text-[11px]"
          >
            <Nfc className="h-3.5 w-3.5 shrink-0 opacity-95 sm:h-4 sm:w-4" aria-hidden />
            NFC
          </span>
          <span
            title="QR 코드로 바로 열기"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white shadow-lg ring-1 ring-black/10 sm:h-12 sm:w-12"
          >
            <QrCode className="h-6 w-6 text-slate-800 sm:h-7 sm:w-7" aria-hidden />
          </span>
        </div>
      </div>
    </div>
  );
}

function SampleFeatureFooter({ features, className }: { features: SampleFeature[]; className?: string }) {
  const sepCls = "text-[#888888]";
  const hintCls =
    "cursor-help underline decoration-dotted decoration-[#bbbbbb] underline-offset-[3px] text-[#666666] hover:text-slate-700";

  return (
    <p className={cn("text-center text-[12px] leading-snug sm:text-[13px]", className)} role="note">
      {features.map((f, i) => (
        <span key={`${i}-${f.text}`}>
          {i > 0 ? (
            <span className={cn("mx-1 select-none", sepCls)} aria-hidden>
              ·
            </span>
          ) : null}
          <span title={f.title} className={hintCls}>
            {f.text}
          </span>
        </span>
      ))}
    </p>
  );
}

/**
 * 랜딩용 미리보기 — 실제 사람·직업 중심 카피로 “나도 저런 명함” 감각을 줍니다. (하단 NFC·QR 안내는 유지)
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
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {sample.topBadges.map((b) => (
            <span
              key={b}
              className="inline-flex rounded-full border border-brand-200/90 bg-brand-50/90 px-2.5 py-1 text-[10px] font-semibold text-brand-900 shadow-sm sm:text-[11px]"
            >
              {b}
            </span>
          ))}
        </div>

        <div className={cn("mt-3", isHero ? "mt-4" : "")}>
          <SampleHeroVisual
            heroBrandLine={sample.heroBrandLine}
            centerName={sample.name}
            accent={sample.accent}
            accentOverlay={sample.accentOverlay}
            isHero={isHero}
          />
        </div>

        <div className="mt-5">
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200/80">
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
            "inline-flex w-full items-center justify-center rounded-xl bg-cta-500 font-bold text-white shadow-lg shadow-cta-900/25 ring-1 ring-cta-400/30 hover:bg-cta-600",
            isHero ? "min-h-12 px-4 text-sm sm:text-[15px]" : "min-h-11 px-3 text-sm",
          )}
        >
          {sample.ctaLabel}
        </span>
        <SampleFeatureFooter features={sample.bottomFeatures} className="mt-1 px-1 pt-0.5" />
      </div>
    </div>
  );
}
