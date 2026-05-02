import { EXPERT_REQUEST_PURPOSE_LABEL, WORK_CATEGORY_OPTIONS_BY_TYPE } from "@/components/experts/expertUiConstants";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { expertBadgeLabel, expertProductionServiceLabels } from "@/lib/expertLabels";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useAppDataStore } from "@/stores/appDataStore";
import { CheckCircle2, ExternalLink, MapPin, Star } from "lucide-react";
import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

export function CreatorProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const creators = useAppDataStore((s) => s.creators);

  const creator = useMemo(() => creators.find((c) => c.id === id), [creators, id]);

  if (!creator) {
    return (
      <div className={cn(layout.pageCompact, "py-16 text-center sm:py-20")}>
        <p className="text-base leading-relaxed text-slate-800">프로필을 찾을 수 없습니다.</p>
        <Link to="/creators" className="mt-6 inline-flex min-h-[52px] items-center text-base font-semibold text-brand-700">
          제작 전문가 목록으로
        </Link>
      </div>
    );
  }

  const st = creator.expert_status ?? "active";
  if (st === "hidden" || st === "rejected") {
    return (
      <div className={cn(layout.pageCompact, "py-16 text-center sm:py-20")}>
        <p className="text-base leading-relaxed text-slate-800">현재 노출되지 않는 전문가입니다.</p>
        <Link to="/creators" className="mt-6 inline-flex min-h-[52px] items-center text-base font-semibold text-brand-700">
          제작 전문가 목록으로
        </Link>
      </div>
    );
  }

  const name = creator.display_name ?? "제작 전문가";
  const rich = creator.portfolios_rich_json ?? [];
  const services = creator.offered_services_json ?? expertProductionServiceLabels[creator.creator_type];
  const workOptions = WORK_CATEGORY_OPTIONS_BY_TYPE[creator.creator_type];

  const goRequest = (purpose: "production" | "promotion" | "consult") => {
    if (!user) {
      navigate("/login", { state: { from: `/creators/${creator.id}` } });
      return;
    }
    navigate(`/creators/${creator.id}/request?purpose=${purpose}`);
  };

  return (
    <div className={cn(layout.pageEditor, "py-10 sm:py-12")}>
      <Link to="/creators" className="inline-flex min-h-11 items-center text-base font-medium text-brand-700">
        ← 제작 전문가 목록
      </Link>

      <Card className="mt-6">
        <CardContent className="space-y-6 p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="break-keep text-2xl font-bold leading-snug tracking-tight text-slate-900 md:text-3xl">
                  {name}
                </h1>
                {creator.is_verified ? <CheckCircle2 className="h-6 w-6 text-brand-600" aria-hidden /> : null}
              </div>
              <Badge tone="brand" className="mt-2 text-sm font-semibold">
                {expertBadgeLabel(creator.creator_type)}
              </Badge>
              <p className="mt-3 text-base font-medium leading-relaxed text-slate-800">{creator.intro}</p>
              {creator.region ? (
                <p className="mt-2 flex items-center gap-1 text-sm text-slate-600">
                  <MapPin className="h-4 w-4" aria-hidden />
                  {creator.region}
                </p>
              ) : null}
              {creator.available_time_text ? (
                <p className="mt-1 text-sm text-slate-600">연락 가능: {creator.available_time_text}</p>
              ) : null}
              {typeof creator.rating_avg === "number" ? (
                <p className="mt-2 inline-flex items-center gap-1 text-sm text-slate-700">
                  <Star className="h-4 w-4 text-amber-500" aria-hidden />
                  <span className="font-bold">{creator.rating_avg.toFixed(1)}</span>
                  <span className="text-slate-500">· 후기 {creator.review_count ?? 0}개</span>
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <Badge tone="default" className="self-start sm:self-end">
                {creator.min_price ? `${(creator.min_price / 10000).toFixed(0)}만원~` : "금액 협의"}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button size="lg" className="min-h-[52px] flex-1" type="button" onClick={() => goRequest("production")}>
              제작 의뢰하기
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="min-h-[52px] flex-1 border-2 border-brand-700 text-brand-900"
              type="button"
              onClick={() => goRequest("promotion")}
            >
              홍보 의뢰하기
            </Button>
            <Button variant="ghost" size="lg" className="min-h-[52px] flex-1" type="button" onClick={() => goRequest("consult")}>
              상담 문의하기
            </Button>
          </div>

          {creator.bio_detail ? (
            <section className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <h2 className="text-lg font-bold text-slate-900">소개</h2>
              <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-slate-800">{creator.bio_detail}</p>
              {creator.who_for_text ? (
                <div className="mt-4">
                  <h3 className="text-sm font-bold text-slate-900">어떤 고객에게 맞나요</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-700">{creator.who_for_text}</p>
                </div>
              ) : null}
              {creator.work_style_text ? (
                <div className="mt-4">
                  <h3 className="text-sm font-bold text-slate-900">작업 방식</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-700">{creator.work_style_text}</p>
                </div>
              ) : null}
            </section>
          ) : null}

          {(creator.categories_json ?? []).length > 0 ? (
            <section>
              <h2 className="text-lg font-semibold text-slate-900">주요 작업 분야</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {(creator.categories_json ?? []).map((c) => (
                  <Badge key={c} tone="default">
                    {c}
                  </Badge>
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-slate-900">포트폴리오</h2>
              {creator.portfolio_url ? (
                <a
                  href={creator.portfolio_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-brand-700"
                >
                  전체 포트폴리오 <ExternalLink className="h-4 w-4" aria-hidden />
                </a>
              ) : null}
            </div>
            {rich.length > 0 ? (
              <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                {rich.map((p) => (
                  <li key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt=""
                        className="h-40 w-full rounded-xl object-cover"
                        loading="lazy"
                      />
                    ) : null}
                    <p className="mt-3 font-bold text-slate-900">{p.title}</p>
                    {p.description ? <p className="mt-1 text-sm text-slate-600">{p.description}</p> : null}
                    {p.portfolio_type ? (
                      <Badge tone="default" className="mt-2 text-xs">
                        {p.portfolio_type}
                      </Badge>
                    ) : null}
                    {p.link_url ? (
                      <a
                        href={p.link_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex text-sm font-semibold text-brand-700 hover:underline"
                      >
                        링크 보기
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (creator.portfolio_items_json ?? []).length > 0 ? (
              <ul className="mt-3 list-inside list-disc text-[15px] text-slate-700">
                {(creator.portfolio_items_json ?? []).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-500">등록된 포트폴리오 카드가 없습니다.</p>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">제공 서비스</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {services.map((s) => (
                <li key={s} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800">
                  {s}
                </li>
              ))}
            </ul>
          </section>

          <p className="text-xs leading-relaxed text-slate-500">
            「{EXPERT_REQUEST_PURPOSE_LABEL.production}」예시 카테고리: {workOptions.slice(0, 3).join(", ")}
            … 선택은 다음 페이지에서 진행합니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
