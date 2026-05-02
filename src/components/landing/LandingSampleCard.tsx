import { cn } from "@/lib/utils";
import { Nfc, QrCode } from "lucide-react";

export type LandingSampleType = "personal" | "business" | "store";

type Props = {
  variant?: "default" | "hero";
  sampleType?: LandingSampleType;
  className?: string;
};

type DualCta = { primary: string; secondary: string };

type LandingSampleDatum = {
  typeLabel: string;
  accent: string;
  accentOverlay: string;
  imageCardEyebrow: string;
  imageCardTitleLine: string;
  imageCardSubLine: string;
  oneLineIntro: string;
  highlightA: string;
  highlightAlabel: string;
  highlightB: string;
  highlightBlabel: string;
  tertiaryLine?: string;
  dualCta: DualCta;
};

const SAMPLES: Record<LandingSampleType, LandingSampleDatum> = {
  personal: {
    typeLabel: "개인형",
    accent: "from-violet-600 via-brand-600 to-indigo-950",
    accentOverlay:
      "bg-[radial-gradient(ellipse_85%_65%_at_50%_-10%,rgba(255,255,255,0.28),transparent_55%),radial-gradient(ellipse_70%_50%_at_100%_100%,rgba(99,102,241,0.35),transparent)]",
    imageCardEyebrow: "DIGITAL CARD · PERSONAL",
    imageCardTitleLine: "김민수",
    imageCardSubLine: "인테리어 디렉터",
    oneLineIntro: "공간을 바꾸면 삶이 바뀝니다",
    highlightAlabel: "전문 분야",
    highlightA: "아파트 리모델링 / 상가 인테리어",
    highlightBlabel: "지역",
    highlightB: "서울 · 경기",
    dualCta: { primary: "문의하기", secondary: "자세히 보기" },
  },
  business: {
    typeLabel: "사업자형",
    accent: "from-emerald-600 via-teal-700 to-slate-950",
    accentOverlay:
      "bg-[radial-gradient(ellipse_90%_55%_at_30%_0%,rgba(52,211,153,0.35),transparent_50%),radial-gradient(ellipse_60%_45%_at_100%_80%,rgba(15,118,110,0.4),transparent)]",
    imageCardEyebrow: "BUSINESS PROFILE",
    imageCardTitleLine: "미노 인테리어",
    imageCardSubLine: "대표 김민수",
    oneLineIntro: "작은 공간도 브랜드처럼 설계합니다",
    highlightAlabel: "업종",
    highlightA: "주거 · 상업공간 인테리어",
    highlightBlabel: "주요 서비스",
    highlightB: "아파트 리모델링 / 매장 인테리어 / 맞춤가구",
    tertiaryLine: "서울 · 경기 · 인천",
    dualCta: { primary: "상담 문의하기", secondary: "시공 사례 보기" },
  },
  store: {
    typeLabel: "매장형",
    accent: "from-amber-500 via-orange-600 to-rose-950",
    accentOverlay:
      "bg-[radial-gradient(ellipse_80%_60%_at_50%_-15%,rgba(253,230,138,0.45),transparent_55%),radial-gradient(ellipse_55%_50%_at_0%_100%,rgba(244,63,94,0.25),transparent)]",
    imageCardEyebrow: "LOCAL STORE",
    imageCardTitleLine: "옥토 가구공방",
    imageCardSubLine: "맞춤 수납장 · 원목 테이블",
    oneLineIntro: "공간에 맞는 가구를 직접 제작합니다",
    highlightAlabel: "영업시간",
    highlightA: "평일 10:00 - 18:00",
    highlightBlabel: "주소",
    highlightB: "경기 남양주시 예시로 12",
    dualCta: { primary: "방문 상담하기", secondary: "위치와 상품 보기" },
  },
};

function ImageStyleCard({
  eyebrow,
  titleLine,
  subLine,
  intro,
  aLabel,
  aValue,
  bLabel,
  bValue,
  extraLine,
  accent,
  accentOverlay,
  dualCta,
  isHero,
}: {
  eyebrow: string;
  titleLine: string;
  subLine: string;
  intro: string;
  aLabel: string;
  aValue: string;
  bLabel: string;
  bValue: string;
  extraLine?: string;
  accent: string;
  accentOverlay: string;
  dualCta: DualCta;
  isHero: boolean;
}) {
  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-2xl bg-gradient-to-br shadow-inner ring-1 ring-white/15",
        accent,
        isHero ? "min-h-[15.5rem] sm:min-h-[17rem]" : "min-h-[14rem] sm:min-h-[15.5rem]",
      )}
      role="img"
      aria-label={`${titleLine} 이미지형 명함 예시`}
    >
      <div className={cn("pointer-events-none absolute inset-0 opacity-[0.88]", accentOverlay)} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-white/[0.08]" />
      <div className="relative flex h-full min-h-[inherit] flex-col justify-between p-4 sm:p-5">
        <p className="text-center font-semibold uppercase tracking-[0.32em] text-[9px] text-white/90 drop-shadow sm:text-[10px]">
          {eyebrow}
        </p>
        <div className="flex flex-1 flex-col justify-center gap-2 px-0.5">
          <div className="text-center">
            <p className="text-lg font-black tracking-tight text-white drop-shadow-md sm:text-xl">{titleLine}</p>
            <p className="mt-1 text-xs font-bold text-white/95 sm:text-sm">{subLine}</p>
          </div>
          <p className="text-center text-[13px] font-bold leading-snug text-white drop-shadow-sm sm:text-sm">{intro}</p>
          <div className="mx-auto mt-1 grid w-full max-w-[18rem] gap-1.5 text-left text-[11px] font-semibold text-white/95 sm:max-w-[20rem] sm:text-xs">
            <p>
              <span className="mr-1.5 rounded bg-white/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wide ring-1 ring-white/25">
                {aLabel}
              </span>
              <span className="leading-snug">{aValue}</span>
            </p>
            <p>
              <span className="mr-1.5 rounded bg-white/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wide ring-1 ring-white/25">
                {bLabel}
              </span>
              <span className="leading-snug">{bValue}</span>
            </p>
            {extraLine ? <p className="text-center text-[11px] font-bold text-white/90 sm:text-xs">{extraLine}</p> : null}
          </div>
          <div className="mx-auto mt-2 flex w-full max-w-[19rem] flex-col gap-2 sm:flex-row sm:justify-center">
            <span className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-white px-3 py-2 text-center text-[11px] font-extrabold text-slate-900 shadow-lg ring-1 ring-black/10 sm:text-xs">
              {dualCta.primary}
            </span>
            <span className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl border-2 border-white/70 bg-white/10 px-3 py-2 text-center text-[11px] font-extrabold text-white shadow-md backdrop-blur-sm sm:text-xs">
              {dualCta.secondary}
            </span>
          </div>
        </div>
        <div className="flex items-end justify-between gap-3 pt-2">
          <span
            title="NFC로 빠르게 연결됩니다"
            className="inline-flex items-center gap-1.5 rounded-lg bg-black/25 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-md ring-1 ring-white/25 backdrop-blur-md sm:text-[11px]"
          >
            <Nfc className="h-3.5 w-3.5 shrink-0 opacity-95 sm:h-4 sm:w-4" aria-hidden />
            NFC
          </span>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white shadow-lg ring-1 ring-black/10 sm:h-12 sm:w-12">
            <QrCode className="h-6 w-6 text-slate-800 sm:h-7 sm:w-7" />
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * 유형별로 입력값이 채워진 상태의 이미지형 명함 + 상세 버튼 느낌 예시입니다.
 */
export function LandingSampleCard({ variant = "default", sampleType = "personal", className }: Props) {
  const isHero = variant === "hero";
  const sample = SAMPLES[sampleType];

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
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200/80">
            {sample.typeLabel} 예시
          </span>
          <span className="text-xs font-semibold text-slate-500">이미지 명함 미리보기</span>
        </div>

        <div className={cn(isHero ? "mt-4" : "mt-3")}>
          <ImageStyleCard
            eyebrow={sample.imageCardEyebrow}
            titleLine={sample.imageCardTitleLine}
            subLine={sample.imageCardSubLine}
            intro={sample.oneLineIntro}
            aLabel={sample.highlightAlabel}
            aValue={sample.highlightA}
            bLabel={sample.highlightBlabel}
            bValue={sample.highlightB}
            extraLine={sample.tertiaryLine}
            accent={sample.accent}
            accentOverlay={sample.accentOverlay}
            dualCta={sample.dualCta}
            isHero={isHero}
          />
        </div>

        <div className="mt-5 space-y-2 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-3 sm:px-4">
          <p className="text-xs font-bold text-slate-500">상세 링크 예시</p>
          <p className="text-sm font-semibold leading-relaxed text-slate-800">
            이미지 명함을 누르거나 &ldquo;{sample.dualCta.secondary}&rdquo;를 누르면 경력·서비스·매장 안내·지도 등이 담긴
            페이지로 연결되는 구조입니다.
          </p>
        </div>
      </div>

      <div className={cn("border-t border-slate-100 px-5 py-3 text-center sm:px-6", isHero && "pb-5 sm:pb-6")}>
        <p className="text-[12px] font-medium leading-snug text-slate-500">
          NFC 터치 · QR 스캔으로 같은 명함이 열리고,
          <span className="mx-1 text-slate-400" aria-hidden>
            ·
          </span>
          링크로도 동일하게 공유됩니다
        </p>
      </div>
    </div>
  );
}
