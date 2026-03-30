import { StatsCard } from "@/components/ui/StatsCard";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useAppDataStore } from "@/stores/appDataStore";
import { CreditCard, Eye, MousePointerClick, Send } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const businessCards = useAppDataStore((s) => s.businessCards);
  const cardViews = useAppDataStore((s) => s.cardViews);
  const cardClicks = useAppDataStore((s) => s.cardClicks);
  const requests = useAppDataStore((s) => s.serviceRequests);
  const applications = useAppDataStore((s) => s.applications);

  const myCards = useMemo(
    () => businessCards.filter((c) => c.user_id === user?.id),
    [businessCards, user?.id],
  );
  const myCardIds = useMemo(() => new Set(myCards.map((c) => c.id)), [myCards]);

  const viewsCount = cardViews.filter((v) => myCardIds.has(v.card_id)).length;
  const clicksCount = cardClicks.filter((c) => myCardIds.has(c.card_id)).length;

  const myOpenRequests = requests.filter(
    (r) => r.client_user_id === user?.id && r.status === "open",
  ).length;

  const myApps = applications.filter((a) => a.creator_user_id === user?.id);

  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    cardViews
      .filter((v) => myCardIds.has(v.card_id))
      .forEach((v) => {
        const d = v.viewed_at.slice(0, 10);
        map.set(d, (map.get(d) ?? 0) + 1);
      });
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }))
      .slice(-14);
  }, [cardViews, myCardIds]);

  const isCreator = user?.role === "creator";

  const displayName =
    user?.name?.trim() ||
    (user?.email?.includes("@") ? user.email.split("@")[0] : null)?.trim() ||
    "사용자";

  return (
    <div className={cn(layout.page, "py-10 sm:py-12")}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-800">Linko 명함</p>
          <h1 className="mt-1 break-keep text-2xl font-bold leading-snug tracking-tight text-slate-900 md:text-3xl">
            내 공간
          </h1>
          <p className="mt-1 text-base leading-relaxed text-slate-600">
            안녕하세요, <span className="font-medium text-slate-900">{displayName}</span>님
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/cards/new"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-brand-800 px-5 text-base font-semibold text-white hover:bg-brand-900 sm:min-h-0 sm:py-2.5"
          >
            명함 만들기
          </Link>
          <Link
            to="/requests/new"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-base font-semibold text-slate-900 hover:bg-slate-50 sm:min-h-0 sm:py-2.5"
          >
            의뢰하기
          </Link>
        </div>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {!isCreator ? (
          <>
            <StatsCard
              label="내 명함"
              value={String(myCards.length)}
              icon={CreditCard}
              hint="공개 링크와 QR로 공유하세요"
            />
            <StatsCard
              label="총 조회"
              value={String(viewsCount)}
              icon={Eye}
              trend="아래 활동 기록에서 추이를 확인하세요"
            />
            <StatsCard
              label="클릭 수"
              value={String(clicksCount)}
              icon={MousePointerClick}
              hint="명함 속 버튼을 누른 횟수예요"
            />
            <StatsCard
              label="진행 중 의뢰"
              value={String(myOpenRequests)}
              icon={Send}
            />
          </>
        ) : (
          <>
            <StatsCard
              label="보낸 제안"
              value={String(myApps.length)}
              icon={Send}
              hint="의뢰에 보낸 제안 개수예요"
            />
            <StatsCard
              label="답을 기다리는 중"
              value={String(myApps.filter((a) => a.status === "pending").length)}
              icon={MousePointerClick}
            />
            <StatsCard
              label="내 명함"
              value={String(myCards.length)}
              icon={CreditCard}
              hint="제작자 계정으로 만든 명함이에요"
            />
            <StatsCard
              label="총 조회"
              value={String(viewsCount)}
              icon={Eye}
              hint="내 명함이 열린 횟수예요"
            />
          </>
        )}
      </div>

      {!isCreator ? (
        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="break-keep text-lg font-semibold text-slate-900 sm:text-xl">활동 기록</h2>
          <p className="mt-1 text-[15px] leading-relaxed text-slate-600 sm:text-base">
            최근 14일 동안 내 명함이 몇 번 열렸는지예요. 이 기기·브라우저에 저장된 기록만 보여요.
          </p>
          <div className="mt-6 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e40af" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#1e40af" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#1e40af"
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}
    </div>
  );
}
