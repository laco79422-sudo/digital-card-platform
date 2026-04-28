import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import type { CreatorProfile, CreatorType } from "@/types/domain";
import { CheckCircle2, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const typeLabels: Record<CreatorType, string> = {
  blog_writer: "블로그 작가",
  youtube_producer: "유튜브 제작",
  shortform_editor: "숏폼 편집",
  thumbnail_designer: "썸네일 디자인",
};

export function CreatorCard({ creator }: { creator: CreatorProfile }) {
  const name = creator.display_name ?? "제작 전문가";
  return (
    <Link to={`/creators/${creator.id}`} className="block h-full">
      <Card className="h-full transition hover:border-brand-200 hover:shadow-md">
        <CardContent className="flex h-full flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900">{name}</h3>
                {creator.is_verified ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                ) : null}
              </div>
              <p className="mt-1 text-sm text-slate-600">{typeLabels[creator.creator_type]}</p>
            </div>
            <Badge tone="brand">{creator.min_price ? `${(creator.min_price / 10000).toFixed(0)}만원~` : "협의"}</Badge>
          </div>
          <p className="line-clamp-3 flex-1 text-[15px] leading-relaxed text-slate-700 sm:text-base">{creator.intro}</p>
          <div className="flex flex-wrap gap-1.5">
            {(creator.categories_json ?? []).slice(0, 4).map((c) => (
              <Badge key={c} tone="default">
                {c}
              </Badge>
            ))}
          </div>
          {creator.region ? (
            <p className="flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="h-3.5 w-3.5" />
              {creator.region}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
