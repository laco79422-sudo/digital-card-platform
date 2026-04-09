import { MessageCircle, Phone } from "lucide-react";

/**
 * 마켓/외주 카드가 아닌 **디지털 명함** 샘플.
 * 링크 이동 없이 시각적 예시만 제공합니다.
 */
export function LandingSampleCard() {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-white/25 bg-white/95 text-left text-slate-900 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.45)]">
      <div className="border-b border-slate-200/90 bg-gradient-to-br from-brand-50 to-white px-5 py-5 sm:px-6 sm:py-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">디지털 명함</p>
        <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.65rem]">공간설계자</h3>
        <p className="mt-1.5 text-sm font-medium text-slate-700">인테리어 제작 / 공간 설계</p>
        <p className="mt-4 text-[15px] leading-relaxed text-slate-700 sm:text-base">
          공간을 설계하고, 경험을 만듭니다.
        </p>
      </div>
      <div className="space-y-2.5 px-5 py-4 sm:px-6">
        <div className="grid gap-2 sm:grid-cols-2">
          <span className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-800 px-3 text-sm font-semibold text-white shadow-sm">
            문의하기
          </span>
          <span className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800">
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
        <p className="pt-2 text-center text-xs text-slate-500">실제 명함은 색·버튼·링크를 자유롭게 꾸밀 수 있어요.</p>
      </div>
    </div>
  );
}
