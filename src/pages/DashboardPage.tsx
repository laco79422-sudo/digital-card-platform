import { BRAND_DISPLAY_NAME, brandCta } from "@/lib/brand";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useAppDataStore } from "@/stores/appDataStore";
import type { User } from "@/types/domain";
import { useMemo } from "react";
import { Link } from "react-router-dom";

function safeDisplayName(user: User | null): string {
  if (!user) return "사용자";
  const n = user.name;
  if (typeof n === "string" && n.trim()) return n.trim();
  const em = user.email;
  if (typeof em === "string" && em.includes("@")) {
    const local = em.split("@")[0]?.trim();
    if (local) return local;
  }
  return "사용자";
}

/** Lucide·StatsCard·중첩 조건부 없이 통계 한 칸만 렌더 (SVG/카드 내부 DOM 최소화) */
function StatBlock({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/5">
      <div className="text-sm font-medium text-slate-600">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
      {sub ? <div className="mt-1 text-sm text-slate-500">{sub}</div> : null}
    </div>
  );
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const businessCards = useAppDataStore((s) => s.businessCards);
  const cardViews = useAppDataStore((s) => s.cardViews);
  const cardClicks = useAppDataStore((s) => s.cardClicks);
  const requests = useAppDataStore((s) => s.serviceRequests);
  const applications = useAppDataStore((s) => s.applications);

  const uid = user?.id ?? "";
  const myCards = useMemo(
    () => (uid ? businessCards.filter((c) => c.user_id === uid) : []),
    [businessCards, uid],
  );
  const myCardIds = useMemo(() => new Set(myCards.map((c) => c.id)), [myCards]);

  const viewsCount = cardViews.filter((v) => myCardIds.has(v.card_id)).length;
  const clicksCount = cardClicks.filter((c) => myCardIds.has(c.card_id)).length;

  const myOpenRequests = uid
    ? requests.filter((r) => r.client_user_id === uid && r.status === "open").length
    : 0;

  const myApps = uid ? applications.filter((a) => a.creator_user_id === uid) : [];

  const isCreator = user?.role === "creator";
  const displayName = safeDisplayName(user);

  return (
    <div className={cn(layout.page, "py-10 sm:py-12")}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2 sm:space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-800">{BRAND_DISPLAY_NAME}</p>
          <h1 className="break-keep text-2xl font-bold leading-snug tracking-tight text-slate-900 md:text-3xl">
            내 공간
          </h1>
          <p className="text-base leading-relaxed text-slate-600">
            안녕하세요, <span className="font-medium text-slate-900">{displayName}</span>님
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/cards/new"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-cta-500 px-5 text-base font-semibold text-white shadow-sm shadow-cta-900/20 hover:bg-cta-600 sm:min-h-0 sm:py-2.5"
          >
            {brandCta.createDigitalCard}
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
        {isCreator ? (
          <StatBlock
            key="creator-apps"
            label="보낸 제안"
            value={String(myApps.length)}
            sub="의뢰에 보낸 제안 개수예요"
          />
        ) : (
          <StatBlock
            key="client-cards"
            label="내 명함"
            value={String(myCards.length)}
            sub="공개 링크와 QR로 공유하세요"
          />
        )}
        {isCreator ? (
          <StatBlock
            key="creator-pending"
            label="답을 기다리는 중"
            value={String(myApps.filter((a) => a.status === "pending").length)}
          />
        ) : (
          <StatBlock key="client-views" label="총 조회" value={String(viewsCount)} />
        )}
        {isCreator ? (
          <StatBlock
            key="creator-mycards"
            label="내 명함"
            value={String(myCards.length)}
            sub="제작자 계정으로 만든 명함이에요"
          />
        ) : (
          <StatBlock
            key="client-clicks"
            label="클릭 수"
            value={String(clicksCount)}
            sub="명함 속 버튼 클릭 횟수예요"
          />
        )}
        {isCreator ? (
          <StatBlock
            key="creator-views"
            label="총 조회"
            value={String(viewsCount)}
            sub="내 명함이 열린 횟수예요"
          />
        ) : (
          <StatBlock key="client-requests" label="진행 중 의뢰" value={String(myOpenRequests)} />
        )}
      </div>

      {!isCreator ? (
        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">활동 기록</h2>
          <p className="mt-3 text-sm text-slate-600">활동 기록은 준비 중입니다.</p>
        </div>
      ) : null}
    </div>
  );
}
