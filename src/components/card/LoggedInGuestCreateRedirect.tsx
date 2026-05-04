import {
  MAIN_CTA_EXISTING_CARD_NOTICE,
  MAIN_CTA_MULTI_CARD_CHOOSE_NOTICE,
  ROUTE_STATE_MAIN_CTA_EXISTING_CARD,
  ROUTE_STATE_MAIN_CTA_PICK_CARD,
} from "@/lib/linkoFlowCopy";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { businessCardOwnedByUser } from "@/lib/businessCardAccess";
import { fetchMyCardsForUser } from "@/services/cardsService";
import { useAppDataStore } from "@/stores/appDataStore";
import { useAuthStore } from "@/stores/authStore";
import type { BusinessCard } from "@/types/domain";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

function mergeMemberNewCardSearch(search: string): string {
  const raw = search.trim().startsWith("?") ? search.trim().slice(1) : search.trim();
  const sp = new URLSearchParams(raw);
  if (!sp.get("industry")?.trim()) {
    sp.set("industry", "interior");
  }
  const out = sp.toString();
  return out ? `?${out}` : "?industry=interior";
}

function sortMineByCreatedDesc(rows: BusinessCard[]): BusinessCard[] {
  return [...rows].sort((a, b) => {
    const ta = Date.parse(a.created_at) || 0;
    const tb = Date.parse(b.created_at) || 0;
    return tb - ta;
  });
}

/**
 * 게스트 명함 진입(`/card/create`, `/create-card`)을 로그인 사용자가 요청했을 때
 * 보유 명함 개수에 따라 편집기·목록·첫 카드 수정으로 라우팅합니다.
 */
export function LoggedInGuestCreateRedirect({ search }: { search: string }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const upsertBusinessCard = useAppDataStore((s) => s.upsertBusinessCard);

  const memberNewSearch = useMemo(() => mergeMemberNewCardSearch(search), [search]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!user?.id) return;

      const finish = (
        mineRows: BusinessCard[],
      ) => {
        if (cancelled) return;
        if (mineRows.length >= 2) {
          navigate("/cards", {
            replace: true,
            state: { [ROUTE_STATE_MAIN_CTA_PICK_CARD]: MAIN_CTA_MULTI_CARD_CHOOSE_NOTICE },
          });
          return;
        }
        if (mineRows.length === 1) {
          navigate(`/cards/${encodeURIComponent(mineRows[0].id)}/edit`, {
            replace: true,
            state: { [ROUTE_STATE_MAIN_CTA_EXISTING_CARD]: MAIN_CTA_EXISTING_CARD_NOTICE },
          });
          return;
        }
        navigate({ pathname: "/cards/new", search: memberNewSearch }, { replace: true });
      };

      try {
        const result = await fetchMyCardsForUser({ id: user.id, email: user.email ?? null });

        let mineRows: BusinessCard[];

        if (result.status !== "ok") {
          mineRows = sortMineByCreatedDesc(
            useAppDataStore.getState().businessCards.filter((c) => businessCardOwnedByUser(c, user)),
          );
        } else {
          for (const c of result.cards) {
            upsertBusinessCard(c);
          }
          mineRows = sortMineByCreatedDesc(
            result.cards.filter((c) => businessCardOwnedByUser(c, user)),
          );
        }

        finish(mineRows);
      } catch {
        if (!cancelled) navigate({ pathname: "/cards/new", search: memberNewSearch }, { replace: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, navigate, upsertBusinessCard, memberNewSearch]);

  return (
    <div className={cn(layout.pageEditor, "flex min-h-[45vh] flex-col items-center justify-center gap-3 py-16")}>
      <Loader2 className="h-10 w-10 animate-spin text-brand-700" aria-hidden />
      <p className="text-sm font-medium text-slate-600">명함 상태를 확인하는 중입니다…</p>
    </div>
  );
}
