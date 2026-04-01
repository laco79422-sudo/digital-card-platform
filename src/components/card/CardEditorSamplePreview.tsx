import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { ExternalLink, Globe, MessageCircle, Phone } from "lucide-react";

const SAMPLE = {
  brandName: "Linko Studio",
  personName: "송민호",
  jobTitle: "디지털 브랜딩 디자이너",
  intro: "온라인에서 나를 소개하고 고객과 연결되는 디지털 명함을 제작합니다.",
  slug: "linko-studio",
  buttons: [
    { label: "전화하기", icon: Phone },
    { label: "홈페이지", icon: Globe },
    { label: "카카오톡 문의", icon: MessageCircle },
  ] as const,
};

/**
 * Static preview shown above the editor form so visitors can picture the finished card.
 */
export function CardEditorSamplePreview() {
  return (
    <div className="mx-auto w-full max-w-md">
      <p className="mb-3 text-center text-sm font-medium text-slate-600">완성 예시 샘플</p>
      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-950 via-brand-950 to-brand-900 text-white shadow-lg shadow-slate-900/20",
        )}
      >
        <div className="px-5 pb-5 pt-6 text-center sm:px-6 sm:pt-7">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-lg font-bold backdrop-blur sm:h-16 sm:w-16 sm:text-xl">
            {SAMPLE.brandName.slice(0, 2)}
          </div>
          <h2 className="mt-4 break-keep text-lg font-bold leading-snug tracking-tight sm:text-xl">
            {SAMPLE.brandName}
          </h2>
          <p className="mt-1.5 text-sm text-white/95 sm:text-base">{SAMPLE.personName}</p>
          <Badge tone="default" className="mt-2.5 border border-white/25 bg-white/10 text-xs text-white sm:text-sm">
            {SAMPLE.jobTitle}
          </Badge>
          <p className="mt-4 max-w-sm text-left text-[13px] leading-relaxed text-white/90 sm:mx-auto sm:text-center sm:text-[15px]">
            {SAMPLE.intro}
          </p>
          <p className="mt-4 break-all text-xs text-brand-200/95 sm:text-sm">
            공개 주소 · <span className="font-medium text-white">/c/{SAMPLE.slug}</span>
          </p>
        </div>
        <div className="border-t border-white/10 bg-white px-4 py-4 sm:px-5">
          <p className="text-center text-xs font-semibold text-slate-500">연결하기</p>
          <div className="mt-3 flex flex-col gap-2">
            {SAMPLE.buttons.map(({ label, icon: Icon }) => (
              <Button
                key={label}
                type="button"
                variant="secondary"
                tabIndex={-1}
                className="pointer-events-none min-h-11 w-full justify-between border-slate-200 px-3.5 text-sm text-slate-900 sm:min-h-12 sm:text-base"
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0 text-brand-700" aria-hidden />
                  {label}
                </span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
