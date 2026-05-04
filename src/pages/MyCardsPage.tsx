import { CardPromotionChannelsPanel } from "@/components/card/CardPromotionChannelsPanel";
import { linkButtonClassName } from "@/components/ui/buttonStyles";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { brandCta } from "@/lib/brand";
import { businessCardOwnedByUser } from "@/lib/businessCardAccess";
import {
  LINKO_CARD_CREATE_FLOW_HREF,
  ROUTE_STATE_MAIN_CTA_PICK_CARD,
} from "@/lib/linkoFlowCopy";
import { canonicalSiteOrigin } from "@/lib/siteOrigin";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { fetchRemoteStatsForCards } from "@/services/cardAnalyticsRemote";
import { fetchMyCardsForUser } from "@/services/cardsService";
import { useAuthStore } from "@/stores/authStore";
import { useAppDataStore } from "@/stores/appDataStore";
import type { BusinessCard } from "@/types/domain";
import type { CardPromoEventType } from "@/types/cardPromo";
import { BarChart3, ClipboardCopy, CreditCard, ExternalLink, Loader2, Pencil, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

function localPromoSignalsForCard(
  cardId: string,
  events: { card_id?: string | null; event_type?: CardPromoEventType }[],
): { views: number; contacts: number } {
  let views = 0;
  let contacts = 0;
  for (const e of events) {
    if (e.card_id !== cardId) continue;
    if (e.event_type === "view") views += 1;
    else if (e.event_type === "contact_click" || e.event_type === "kakao_click" || e.event_type === "form_submit")
      contacts += 1;
  }
  return { views, contacts };
}

function buildMineFromServer(rows: BusinessCard[], userId: string, email?: string | null): BusinessCard[] {
  const u = userId.trim();
  const mail = email?.trim().toLowerCase() ?? "";
  return rows.filter(
    (c) =>
      c.user_id === u ||
      c.owner_id === u ||
      Boolean(mail && (c.owner_email?.trim().toLowerCase() === mail || c.email?.trim().toLowerCase() === mail)),
  );
}

export function MyCardsPage() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const navigate = useNavigate();

  const businessCards = useAppDataStore((s) => s.businessCards);
  const upsertBusinessCard = useAppDataStore((s) => s.upsertBusinessCard);
  const cardPromoEvents = useAppDataStore((s) => s.cardPromoEvents);

  const mineFromStore = useMemo(() => {
    if (!user?.id) return [];
    return businessCards.filter((c) => businessCardOwnedByUser(c, user));
  }, [businessCards, user]);

  type LoadState =
    | { kind: "idle" }
    | { kind: "loading" }
    | { kind: "error"; code: string; detail?: string }
    | { kind: "success" };

  const [loadState, setLoadState] = useState<LoadState>({ kind: "idle" });
  const [serverMine, setServerMine] = useState<BusinessCard[] | null>(null);
  const [statsByCard, setStatsByCard] = useState<Map<string, { views: number; inquiries: number }> | null>(null);
  const [extraCardConfirmOpen, setExtraCardConfirmOpen] = useState(false);

  /** 서버 결과가 우선입니다. 불러오기 실패 시 localStorage 재수화된 카드 목록만으로 폴백합니다 */
  const displayedCards = serverMine ?? mineFromStore;

  const refreshFromRemote = useCallback(async () => {
    if (!user?.id) {
      setLoadState({ kind: "idle" });
      setServerMine(null);
      setStatsByCard(null);
      return;
    }

    setLoadState({ kind: "loading" });
    try {
      const result = await fetchMyCardsForUser({ id: user.id, email: user.email ?? null });

      if (result.status === "error") {
        setLoadState({ kind: "error", code: "fetch_failed", detail: result.error ?? "" });
        return;
      }

      if (result.status === "not_configured") {
        setLoadState({ kind: "error", code: "not_configured" });
        return;
      }

      for (const card of result.cards) {
        upsertBusinessCard(card);
      }

      const mineRows = buildMineFromServer(result.cards, user.id, user.email ?? null);
      setServerMine(mineRows);
      setLoadState({ kind: "success" });

      if (mineRows.length > 0) {
        const remoteStats = await fetchRemoteStatsForCards(mineRows.map((c) => c.id));
        setStatsByCard(remoteStats);
      } else {
        setStatsByCard(null);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setLoadState({ kind: "error", code: "fetch_failed", detail: msg });
    }
  }, [user, upsertBusinessCard]);

  useEffect(() => {
    setServerMine(null);
    setStatsByCard(null);
    setLoadState({ kind: "idle" });
  }, [user?.id]);

  useEffect(() => {
    void refreshFromRemote();
  }, [refreshFromRemote]);

  const copyPublicUrl = (slug: string) => {
    const url = `${canonicalSiteOrigin()}/c/${encodeURIComponent(slug)}`;
    void navigator.clipboard?.writeText(url);
  };

  const justSavedNotice = Boolean(location.state && typeof location.state === "object" && "showSavedNotice" in location.state);

  const pickCardBannerRaw =
    typeof location.state === "object" && location.state !== null
      ? (location.state as Record<string, unknown>)[ROUTE_STATE_MAIN_CTA_PICK_CARD]
      : undefined;
  const pickCardBanner =
    typeof pickCardBannerRaw === "string" && pickCardBannerRaw.trim() ? pickCardBannerRaw : null;

  const goExtraCardPurchase = () => {
    navigate("/dashboard", { state: { openExtraCardModal: true } });
    setExtraCardConfirmOpen(false);
  };

  const showInitialSpinner =
    !!user?.id &&
    (loadState.kind === "loading" || loadState.kind === "idle") &&
    serverMine === null &&
    mineFromStore.length === 0;

  const refreshingTopBar = !!user?.id && loadState.kind === "loading" && displayedCards.length > 0;

  const loadErrorBanner =
    !!user?.id && loadState.kind === "error" ? (
      <div className="space-y-3">
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-900">
          {loadState.code === "not_configured" ? (
            <p>
              Supabase가 설정되어 있지 않아 서버에서 명함을 불러올 수 없습니다. 로컬 캐시에 남아 있으면 아래 목록은 참고만 해
              주세요.
            </p>
          ) : (
            <>
              <p>명함 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
              {loadState.detail ? (
                <p className="mt-2 font-mono text-xs text-rose-800 opacity-90">{loadState.detail}</p>
              ) : null}
            </>
          )}
        </div>
        <button
          type="button"
          className={linkButtonClassName({ variant: "outline", size: "sm", className: "gap-2" })}
          onClick={() => void refreshFromRemote()}
        >
          <RefreshCw className="h-4 w-4" />
          다시 시도
        </button>
      </div>
    ) : null;

  const cardListJsx =
    displayedCards.length === 0
      ? null
      : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {displayedCards.map((card) => {
              const publicPath = `/c/${card.slug}`;
              const fullPublicUrl = `${canonicalSiteOrigin()}${publicPath}`;
              const ridHost = canonicalSiteOrigin().replace(/^https:\/\//, "");
              const remote = statsByCard?.get(card.id);
              const localSig = localPromoSignalsForCard(card.id, cardPromoEvents);
              const views = remote?.views ?? localSig.views;
              const inquiries = remote?.inquiries ?? localSig.contacts;
              const typeLabel =
                card.preview_card_type?.trim() ||
                (card.design_type === "business"
                  ? "비즈니스형"
                  : card.design_type === "emotional"
                    ? "감성형"
                    : card.design_type === "simple"
                      ? "심플"
                      : "") ||
                "명함";

              return (
                <li key={card.id}>
                  <Card>
                    <CardContent className="flex flex-col gap-4 p-5">
                      <div className="min-w-0">
                        <h2 className="text-lg font-semibold leading-snug text-slate-900">
                          {(card.marketing_title || card.tagline || card.brand_name || card.person_name || "제목 없음").trim()}
                        </h2>
                        <p className="mt-1 text-sm text-slate-600">유형 · {typeLabel}</p>
                        <p className="mt-1 text-xs text-slate-500">{card.person_name} · {card.job_title}</p>
                        <p className="mt-3 break-all text-xs text-slate-500">
                          공개 링크 ·{" "}
                          <a href={fullPublicUrl} target="_blank" rel="noreferrer" className="underline">
                            {ridHost}
                            {publicPath}
                          </a>
                        </p>
                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-700">
                          <span>조회 {views}</span>
                          <span>문의 {inquiries}</span>
                        </div>
                        <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                          조회·문의 숫자는 가능한 경우 card_views·inquiry_logs 합계이며, 미연동이면 이 브라우저의 채널 이벤트 캐시로 계산했습니다.
                        </p>
                      </div>
                      <div className="flex w-full shrink-0 flex-wrap gap-2">
                        <Link
                          to={publicPath}
                          target="_blank"
                          rel="noreferrer"
                          className={linkButtonClassName({ variant: "secondary", size: "sm", className: "gap-2" })}
                        >
                          <ExternalLink className="h-4 w-4" />
                          보기
                        </Link>
                        <button
                          type="button"
                          className={linkButtonClassName({ variant: "outline", size: "sm", className: "gap-2" })}
                          onClick={() => copyPublicUrl(card.slug)}
                        >
                          <ClipboardCopy className="h-4 w-4" />
                          링크 복사
                        </button>
                        <Link
                          to={`/cards/${card.id}/edit`}
                          className={linkButtonClassName({ variant: "outline", size: "sm", className: "gap-2" })}
                        >
                          <Pencil className="h-4 w-4" />
                          수정하기
                        </Link>
                        <Link
                          to="/dashboard"
                          className={linkButtonClassName({ variant: "outline", size: "sm", className: "gap-2" })}
                        >
                          <BarChart3 className="h-4 w-4" />
                          성과 보기
                        </Link>
                      </div>
                    </CardContent>
                    <div className="border-t border-slate-100 px-5 pb-5 pt-4">
                      <CardPromotionChannelsPanel card={card} />
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        );

  const emptySavedJsx =
    user?.id && loadState.kind === "success" && displayedCards.length === 0 ? (
      <EmptyState
        icon={CreditCard}
        title="아직 만든 명함이 없어요"
        description="저장하면 Supabase 계정에 남으며, 새로 고침·재배포 후에도 이곳에서 이어져요."
        action={() => {
          navigate(LINKO_CARD_CREATE_FLOW_HREF);
        }}
        actionLabel={brandCta.createDigitalCard}
      />
    ) : null;

  return (
    <div className={cn(layout.page, "py-10 sm:py-12")}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="break-keep text-2xl font-bold leading-snug tracking-tight text-slate-900 md:text-3xl">
            내 명함
          </h1>
          <p className="mt-1 text-base leading-relaxed text-slate-600">
            명함 목록은 Supabase 계정(DB) 기준이며, 배포 후에도 유지됩니다.
          </p>
          {user?.id && loadState.kind === "success" ? (
            <p className="mt-2 text-sm text-slate-500">내 명함 {displayedCards.length}개</p>
          ) : null}
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Link
            to="/create-for-others"
            className={cn(
              "w-full sm:w-auto",
              linkButtonClassName({ variant: "outline", size: "lg", className: "w-full sm:w-auto" }),
            )}
          >
            명함 대신 만들어주기
          </Link>
          <button
            type="button"
            onClick={() => {
              if (displayedCards.length === 0) {
                navigate(LINKO_CARD_CREATE_FLOW_HREF);
                return;
              }
              if (displayedCards.length >= 2) {
                setExtraCardConfirmOpen(true);
                return;
              }
              goExtraCardPurchase();
            }}
            className={cn("w-full sm:w-auto", linkButtonClassName({ size: "lg", className: "w-full sm:w-auto" }))}
          >
            {displayedCards.length >= 1 ? "명함 추가하기" : "내 명함 만들기"}
          </button>
        </div>
      </div>

      {justSavedNotice ? (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          명함이 서버에 저장되었습니다. 공개 설정은 각 카드에서 확인해 주세요.
        </div>
      ) : null}

      {pickCardBanner ? (
        <div className="mt-6 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold leading-relaxed text-brand-950">
          {pickCardBanner}
        </div>
      ) : null}

      {!user?.id ? (
        <div className="mt-10 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          로그인 후 계정(DB) 기준 명함 목록을 불러옵니다.
        </div>
      ) : (
        <>
          {loadErrorBanner ? <div className="mt-8">{loadErrorBanner}</div> : null}

          {loadState.kind === "error" && mineFromStore.length > 0 ? (
            <p className="mt-4 text-xs text-slate-600">아래는 이 브라우저 캐시에 남아 있는 명함 목록입니다.</p>
          ) : null}

          {showInitialSpinner ? (
            <div className="mt-10 flex flex-col items-center gap-3 py-16">
              <Loader2 className="h-10 w-10 animate-spin text-brand-700" aria-hidden />
              <p className="text-sm font-medium text-slate-600">명함 정보를 불러오는 중입니다</p>
            </div>
          ) : null}

          {!showInitialSpinner && user?.id ? (
            <div className="mt-10 space-y-4">
              {refreshingTopBar ? (
                <p className="flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-brand-700" aria-hidden />
                  서버 명함 목록 동기화 중…
                </p>
              ) : null}
              {cardListJsx}
              {!cardListJsx ? emptySavedJsx : null}
              {loadState.kind === "success" &&
              displayedCards.length === 0 &&
              justSavedNotice ? (
                <button
                  type="button"
                  className={linkButtonClassName({ variant: "outline", size: "sm" })}
                  onClick={() => void refreshFromRemote()}
                >
                  목록 새로 고침
                </button>
              ) : null}
            </div>
          ) : null}
        </>
      )}
      {extraCardConfirmOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="extra-card-modal-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h2 id="extra-card-modal-title" className="text-lg font-bold text-slate-900">
              명함이 여러 개입니다
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              편집할 명함을 아래 목록에서 골라 주세요. 새 명함을 추가하려면 다음 화면에서 안내와 결제 흐름을 확인해야 할 수
              있습니다.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className={linkButtonClassName({ variant: "outline", size: "lg", className: "w-full sm:w-auto" })}
                onClick={() => setExtraCardConfirmOpen(false)}
              >
                취소
              </button>
              <button
                type="button"
                className={linkButtonClassName({ variant: "primary", size: "lg", className: "w-full sm:w-auto" })}
                onClick={() => goExtraCardPurchase()}
              >
                새 명함 추가 안내 받기
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
