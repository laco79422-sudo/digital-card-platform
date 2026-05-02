import { CreatorCard } from "@/components/ui/CreatorCard";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { expertTypeTabLabels } from "@/lib/expertLabels";
import { useAppDataStore } from "@/stores/appDataStore";
import type { CreatorProfile, CreatorType } from "@/types/domain";
import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

type TabId = CreatorType | "all";

type SortOption = "newest" | "reviews";
type ReqFilterOption = "all" | "open" | "closed";
type PortfolioFilter = "any" | "has";

function isExpertVisible(expert: CreatorProfile): boolean {
  const st = expert.expert_status ?? "active";
  return st !== "hidden" && st !== "rejected";
}

export function CreatorDirectoryPage() {
  const creators = useAppDataStore((s) => s.creators);
  const [tab, setTab] = useState<TabId>("all");

  /** 의뢰 가능 = accepting_requests 명시 거짓 아님 */
  const [reqOpenFilter, setReqOpenFilter] = useState<ReqFilterOption>("all");
  const [portfolioFilter, setPortfolioFilter] = useState<PortfolioFilter>("any");
  const [regionQuery, setRegionQuery] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");

  const regionsForFilter = useMemo(() => {
    const set = new Set<string>();
    for (const c of creators) {
      if (!c.region?.trim()) continue;
      set.add(c.region.trim());
    }
    return [...set].slice(0, 30);
  }, [creators]);

  const filtered = useMemo(() => {
    let rows = creators.filter(isExpertVisible);
    if (tab !== "all") rows = rows.filter((c) => c.creator_type === tab);
    if (regionQuery.trim()) {
      const q = regionQuery.trim().toLowerCase();
      rows = rows.filter((c) => (c.region ?? "").toLowerCase().includes(q));
    }
    if (reqOpenFilter === "open") {
      rows = rows.filter((c) => c.accepting_requests !== false);
    } else if (reqOpenFilter === "closed") {
      rows = rows.filter((c) => c.accepting_requests === false);
    }
    if (portfolioFilter === "has") {
      rows = rows.filter((c) => {
        const n =
          c.portfolio_count_override ??
          Math.max(c.portfolios_rich_json?.length ?? 0, c.portfolio_items_json?.length ?? 0);
        return n > 0;
      });
    }

    rows = [...rows].sort((a, b) => {
      if (sort === "reviews") return (b.review_count ?? 0) - (a.review_count ?? 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return rows;
  }, [creators, tab, regionQuery, reqOpenFilter, portfolioFilter, sort]);

  const tabs: { id: TabId; label: string }[] = [
    { id: "all", label: "전체" },
    { id: "card_design", label: expertTypeTabLabels.card_design },
    { id: "blog", label: expertTypeTabLabels.blog },
    { id: "video", label: expertTypeTabLabels.video },
    { id: "program", label: expertTypeTabLabels.program },
  ];

  return (
    <div className={cn(layout.page, "py-10 sm:py-12")}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-bold text-brand-800">린코 제작 전문가 모음</p>
          <h1 className="mt-2 break-keep text-2xl font-bold leading-snug tracking-tight text-slate-900 md:text-3xl">
            제작 전문가 둘러보기
          </h1>
          <p className="mt-3 text-base leading-relaxed text-slate-700">
            명함디자인, 블로그, 영상제작, 프로그램 전문가들이 모여 있습니다. 필요한 전문가를 선택해 제작 의뢰나 홍보
            의뢰를 시작해 보세요.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            명함디자인부터 블로그, 영상제작, 프로그램까지 당신의 홍보를 도와줄 전문가들이 모여 있습니다.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            누구나 전문가로 신청할 수 있고, 등록된 포트폴리오는 회원들이 열람할 수 있습니다.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/creators/apply"
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-base font-bold text-white shadow-sm hover:bg-slate-800"
            >
              전문가로 등록하기
              <ArrowRight className="h-5 w-5" aria-hidden />
            </Link>
            <p className="max-w-xs text-sm text-slate-600">나도 전문가로 등록하고 의뢰를 받아 보세요.</p>
          </div>
        </div>
        <div className="shrink-0 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-700 lg:text-right">
          <p className="font-semibold text-slate-900">바로 확인</p>
          <ul className="mt-2 space-y-1 text-left text-slate-600 lg:text-right">
            <li>어떤 전문가가 있는지</li>
            <li>어떤 일을 해 주는지</li>
            <li>직접 의뢰·신청 방법</li>
          </ul>
        </div>
      </div>

      <div className="mt-10 flex gap-2 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "min-h-11 shrink-0 rounded-full px-4 py-2.5 text-base font-medium transition-colors",
              tab === t.id
                ? "bg-brand-900 text-white"
                : "bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <p className="text-sm font-bold text-slate-900">필터</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-xs font-semibold text-slate-700">
            의뢰 가능
            <select
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
              value={reqOpenFilter}
              onChange={(e) => setReqOpenFilter(e.target.value as ReqFilterOption)}
            >
              <option value="all">전체</option>
              <option value="open">의뢰 받는 전문가</option>
              <option value="closed">일시 중단</option>
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-700">
            포트폴리오
            <select
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
              value={portfolioFilter}
              onChange={(e) => setPortfolioFilter(e.target.value as PortfolioFilter)}
            >
              <option value="any">전체</option>
              <option value="has">포트폴리오 있음</option>
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-700">
            활동 지역
            <input
              list="creator-region-suggest"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
              placeholder="예: 서울"
              value={regionQuery}
              onChange={(e) => setRegionQuery(e.target.value)}
            />
            <datalist id="creator-region-suggest">
              {regionsForFilter.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </label>
          <label className="block text-xs font-semibold text-slate-700">
            정렬
            <select
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
            >
              <option value="newest">최신순</option>
              <option value="reviews">후기 많은 순</option>
            </select>
          </label>
        </div>
      </div>

      <div className="mt-10 flex justify-end">
        <Link
          to="/creators/apply"
          className="inline-flex min-h-11 items-center rounded-xl px-5 text-base font-semibold text-brand-800 underline-offset-4 hover:underline"
        >
          전문가로 등록하기 →
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
          <p className="font-semibold text-slate-900">조건에 맞는 전문가가 없습니다.</p>
          <p className="mt-2 text-sm text-slate-600">필터를 바꾸거나, 직접 전문가로 등록해 보세요.</p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <li key={c.id}>
              <CreatorCard creator={c} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
