import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { linkButtonClassName } from "@/components/ui/buttonStyles";
import { Card, CardContent } from "@/components/ui/Card";
import { expertBadgeLabel } from "@/lib/expertLabels";
import { cn } from "@/lib/utils";
import type { CreatorProfile } from "@/types/domain";
import { CheckCircle2, MapPin, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

function portfolioCountOf(c: CreatorProfile): number {
  if (typeof c.portfolio_count_override === "number") return c.portfolio_count_override;
  const rich = c.portfolios_rich_json?.length ?? 0;
  const items = c.portfolio_items_json?.length ?? 0;
  return Math.max(rich, items);
}

export function CreatorCard({ creator }: { creator: CreatorProfile }) {
  const navigate = useNavigate();
  const name = creator.display_name ?? "제작 전문가";
  const reviews = creator.review_count ?? 0;
  const rating = creator.rating_avg;
  const portfolios = portfolioCountOf(creator);
  const regions = creator.region ?? "";

  return (
    <Card className="h-full transition hover:border-brand-200 hover:shadow-md">
      <CardContent className="flex h-full flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-slate-900">{name}</h3>
              {creator.is_verified ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
              ) : null}
            </div>
            <Badge tone="brand" className="mt-2 text-xs font-semibold">
              {expertBadgeLabel(creator.creator_type)}
            </Badge>
          </div>
        </div>

        <p className="line-clamp-2 text-[15px] font-medium leading-relaxed text-slate-800">{creator.intro}</p>

        {(creator.categories_json ?? []).length > 0 ? (
          <p className="text-xs leading-relaxed text-slate-600">
            <span className="font-bold text-slate-800">주요 작업:</span>{" "}
            {(creator.categories_json ?? []).slice(0, 4).join(" · ")}
          </p>
        ) : null}

        {regions ? (
          <p className="flex items-center gap-1 text-xs text-slate-600">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {regions}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
          <span>
            포트폴리오 <span className="font-bold text-slate-900">{portfolios}</span>개
          </span>
          <span aria-hidden className="text-slate-300">
            ·
          </span>
          {typeof rating === "number" ? (
            <span className="inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-amber-500" aria-hidden />
              <span className="font-semibold text-slate-900">{rating.toFixed(1)}</span>
              <span>· 후기 {reviews}개</span>
            </span>
          ) : (
            <span>
              후기 <span className="font-semibold text-slate-900">{reviews}</span>개
            </span>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-2 sm:flex-row">
          <Link
            to={`/creators/${creator.id}`}
            className={cn(linkButtonClassName({ variant: "secondary", size: "lg" }), "w-full min-h-[48px]")}
          >
            자세히 보기
          </Link>
          <Button
            size="lg"
            className="w-full min-h-[48px]"
            type="button"
            onClick={() => navigate(`/creators/${creator.id}/request`)}
          >
            의뢰하기
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
