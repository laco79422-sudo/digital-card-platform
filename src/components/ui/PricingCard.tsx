import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

export function PricingCard({
  name,
  priceLabel,
  description,
  features,
  highlighted,
  cta,
  href,
}: {
  name: string;
  priceLabel: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
  href: string;
}) {
  return (
    <Card
      className={cn(
        "relative flex flex-col",
        highlighted && "border-brand-400 ring-2 ring-brand-500/20",
      )}
    >
      {highlighted ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-800 px-3 py-0.5 text-xs font-medium text-white">
          추천
        </span>
      ) : null}
      <CardHeader>
        <h3 className="text-lg font-semibold text-slate-900">{name}</h3>
        <p className="mt-2 text-3xl font-bold tracking-tight text-brand-900">{priceLabel}</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <ul className="flex flex-1 flex-col gap-2.5 text-[15px] leading-relaxed text-slate-700 sm:text-base">
          {features.map((f) => (
            <li key={f} className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <Link
          to={href}
          className={cn(
            "inline-flex min-h-[52px] w-full items-center justify-center rounded-xl text-base font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
            highlighted
              ? "bg-brand-800 text-white shadow-sm shadow-brand-900/20 hover:bg-brand-900"
              : "border border-slate-300 bg-white text-brand-900 hover:bg-slate-50",
          )}
        >
          {cta}
        </Link>
      </CardContent>
    </Card>
  );
}
