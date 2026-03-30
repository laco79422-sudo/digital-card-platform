import { CreatorCard } from "@/components/ui/CreatorCard";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { useAppDataStore } from "@/stores/appDataStore";
import type { CreatorType } from "@/types/domain";
import { useMemo, useState } from "react";

const tabs: { id: CreatorType | "all"; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "blog_writer", label: "블로그" },
  { id: "youtube_producer", label: "유튜브" },
  { id: "shortform_editor", label: "숏폼" },
  { id: "thumbnail_designer", label: "썸네일" },
];

export function CreatorDirectoryPage() {
  const creators = useAppDataStore((s) => s.creators);
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("all");

  const filtered = useMemo(() => {
    if (tab === "all") return creators;
    return creators.filter((c) => c.creator_type === tab);
  }, [creators, tab]);

  return (
    <div className={cn(layout.page, "py-10 sm:py-12")}>
      <h1 className="break-keep text-2xl font-bold leading-snug tracking-tight text-slate-900 md:text-3xl">
        제작자 둘러보기
      </h1>
      <p className="mt-2 text-base leading-relaxed text-slate-600">
        블로그와 유튜브 제작자를 한곳에서 찾고, 프로필에서 바로 지원하세요.
      </p>
      <div className="mt-8 flex gap-2 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2.5 text-base font-medium transition-colors min-h-11",
              tab === t.id
                ? "bg-brand-900 text-white"
                : "bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <li key={c.id}>
            <CreatorCard creator={c} />
          </li>
        ))}
      </ul>
    </div>
  );
}
