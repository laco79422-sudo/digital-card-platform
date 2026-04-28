import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

type Props = {
  name: string;
  /** 레거시: 플랜 상단 보조 라벨 — tagline 미사용 시에만 표시 */
  audience?: string;
  priceLabel: string;
  /** 가격 옆·아래 작은 글씨 (예: "월", "/ 월") — tagline 모드에서 가격 행 옆에 붙일 수 있음 */
  description?: string;
  /** 선택형 레이아웃: 한 줄 설명 (랜딩 단순 카드). 있으면 audience 기존 헤더 대신 이 구조 사용 */
  tagline?: string;
  /** 👉 이런 분께 추천 */
  recommendFor?: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
  href: string;
};

export function PricingCard({
  name,
  audience,
  priceLabel,
  description,
  tagline,
  recommendFor,
  features,
  highlighted,
  cta,
  href,
}: Props) {
  const simple = Boolean(tagline);

  return (
    <Card
      className={cn(
        "relative flex h-full flex-col transition-shadow",
        highlighted && "border-brand-400 shadow-lg shadow-brand-900/10 ring-2 ring-brand-500/25",
      )}
    >
      {highlighted ? (
        <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-brand-800 px-3 py-0.5 text-xs font-bold text-white shadow-sm">
          추천
        </span>
      ) : null}
      <CardHeader className={simple ? "pb-2" : undefined}>
        {!simple && audience ? (
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-800">{audience}</p>
        ) : null}
        <h3 className="text-lg font-semibold text-slate-900">{name}</h3>
        {simple ? (
          <>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
              <p className="text-3xl font-bold tracking-tight text-brand-900">{priceLabel}</p>
              {description ? (
                <span className="text-sm font-medium text-slate-500">{description}</span>
              ) : null}
            </div>
            <p className="mt-2 text-[15px] font-medium leading-snug text-slate-700">{tagline}</p>
          </>
        ) : (
          <>
            <p className="mt-2 text-3xl font-bold tracking-tight text-brand-900">{priceLabel}</p>
            {description ? (
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
            ) : null}
          </>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 pt-0">
        <ul className="flex flex-1 flex-col gap-2.5 text-[15px] leading-relaxed text-slate-700 sm:text-base">
          {features.map((f) => (
            <li key={f} className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        {recommendFor ? (
          <div className="rounded-xl bg-slate-50 px-3 py-3 ring-1 ring-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
              <span aria-hidden>👉 </span>이런 분께 추천
            </p>
            <p className="mt-1.5 text-sm font-medium leading-snug text-slate-800">{recommendFor}</p>
          </div>
        ) : null}
        <Link
          to={href}
          className={cn(
            "mt-auto inline-flex min-h-[52px] w-full items-center justify-center rounded-xl text-base font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
            highlighted
              ? "bg-cta-500 text-white shadow-sm shadow-cta-900/20 hover:bg-cta-600"
              : "border border-slate-300 bg-white text-brand-900 hover:bg-slate-50",
          )}
        >
          {cta}
        </Link>
      </CardContent>
    </Card>
  );
}
