import { linkButtonClassName } from "@/components/ui/buttonStyles";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import {
  fetchAdEventCounts,
  fetchMyAds,
  type AdvertiserAdRow,
} from "@/services/rewardAdsService";
import { useAuthStore } from "@/stores/authStore";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function formatPct(views: number, clicks: number): string {
  if (views <= 0) return "0%";
  return `${((clicks / views) * 100).toFixed(1)}%`;
}

export function AdvertiserDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [ads, setAds] = useState<AdvertiserAdRow[]>([]);
  const [counts, setCounts] = useState<Map<string, { views: number; clicks: number }>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const { ads: rows, error: e1 } = await fetchMyAds(user.id);
      if (cancelled) return;
      if (e1) setError(e1);
      setAds(rows);
      const ids = rows.map((r) => r.id);
      const map = await fetchAdEventCounts(ids);
      if (cancelled) return;
      setCounts(map);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <div className={cn(layout.page, "py-10 sm:py-12")}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-800">광고주</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">내 광고 대시보드</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
            노출·클릭은 이벤트 집계 기준이며, 사용 예산은 클릭 과금 누적입니다.
          </p>
        </div>
        <Link to="/ads/create" className={linkButtonClassName({ variant: "primary", size: "md", className: "font-bold" })}>
          새 광고 등록
        </Link>
      </div>

      {loading ? (
        <div className="mt-16 flex justify-center text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
        </div>
      ) : error ? (
        <p className="mt-10 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950">
          {error}
        </p>
      ) : ads.length === 0 ? (
        <p className="mt-10 text-sm text-slate-600">
          등록된 광고가 없습니다.{" "}
          <Link to="/ads/create" className="font-semibold text-brand-800 underline-offset-4 hover:underline">
            광고 등록하기
          </Link>
        </p>
      ) : (
        <ul className="mt-10 space-y-6">
          {ads.map((ad) => {
            const c = counts.get(ad.id) ?? { views: 0, clicks: 0 };
            const ctr = formatPct(c.views, c.clicks);
            return (
              <li
                key={ad.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 sm:p-6"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{ad.title}</h2>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      상태: {ad.status} · 유형: {ad.ad_type ?? "—"}
                    </p>
                  </div>
                </div>
                <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/90 px-4 py-3">
                    <dt className="text-xs font-semibold text-slate-500">총 노출수</dt>
                    <dd className="mt-1 text-xl font-extrabold tabular-nums text-slate-900">{c.views}</dd>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/90 px-4 py-3">
                    <dt className="text-xs font-semibold text-slate-500">총 클릭수</dt>
                    <dd className="mt-1 text-xl font-extrabold tabular-nums text-slate-900">{c.clicks}</dd>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/90 px-4 py-3">
                    <dt className="text-xs font-semibold text-slate-500">클릭률</dt>
                    <dd className="mt-1 text-xl font-extrabold tabular-nums text-brand-900">{ctr}</dd>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/90 px-4 py-3">
                    <dt className="text-xs font-semibold text-slate-500">사용 예산</dt>
                    <dd className="mt-1 text-xl font-extrabold tabular-nums text-slate-900">
                      {ad.spent_budget.toLocaleString("ko-KR")}원
                    </dd>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-emerald-50/80 px-4 py-3">
                    <dt className="text-xs font-semibold text-emerald-800">남은 예산</dt>
                    <dd className="mt-1 text-xl font-extrabold tabular-nums text-emerald-950">
                      {ad.budget.toLocaleString("ko-KR")}원
                    </dd>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/90 px-4 py-3">
                    <dt className="text-xs font-semibold text-slate-500">클릭당 과금 / 리워드</dt>
                    <dd className="mt-1 text-sm font-bold text-slate-800">
                      {ad.cost_per_click.toLocaleString("ko-KR")} / {ad.reward_per_click.toLocaleString("ko-KR")} P
                    </dd>
                  </div>
                </dl>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
