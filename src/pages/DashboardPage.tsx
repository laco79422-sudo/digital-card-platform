import { AccountDeletionSection } from "@/components/account/AccountDeletionSection";
import { RewardAdsSection } from "@/components/reward-ads/RewardAdsSection";
import { Input } from "@/components/ui/Input";
import { CardQrAndExportPanel } from "@/components/card-print/CardQrAndExportPanel";
import { SHOW_PENDING_CARD_SAVED_STATE } from "@/services/pendingCardDraftFlush";
import { BRAND_DISPLAY_NAME } from "@/lib/brand";
import { buildNfcAcceptUrl, canonicalSiteOrigin } from "@/lib/siteOrigin";
import { buildCardShareUrl, resolveBusinessCardPublicUrl } from "@/lib/cardShareUrl";
import { shareCardLinkNativeOrder } from "@/lib/kakaoWebShare";
import { buildReferralCode, buildSignupReferralGuestPreviewUrl, buildSignupReferralUrl, rewardMonthsForReferralCount } from "@/lib/referrals";
import {
  REFERRAL_PROMO_IMAGE_URL,
  buildReferralShareMessageText,
  copyReferralPromoImage,
  downloadReferralPromoImage,
} from "@/lib/referralPromo";
import { layout } from "@/lib/ui-classes";
import {
  DESIGN_REQUEST_PAYMENT_STATUS_LABEL,
  DESIGN_REQUEST_STATUS_LABEL,
  DESIGN_REQUEST_STYLE_LABEL,
} from "@/lib/designRequestLabels";
import { DIRECT_REQUEST_STATUS_LABEL, EXPERT_REQUEST_PURPOSE_LABEL } from "@/components/experts/expertUiConstants";
import { cn } from "@/lib/utils";
import { CardHeroThumbnailImg } from "@/components/digital-card/CardHeroThumbnailImg";
import { getCardHeroImageUrl } from "@/lib/businessCardHeroImage";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  createAdditionalCard,
  EXTRA_CARD_PRICE,
  handleExtraCardPaymentSuccess,
  startExtraCardPayment,
} from "@/services/extraCardPaymentService";
import {
  fetchRemoteActionCountForOwner,
  fetchRemoteCardViewCountForCards,
  fetchRemoteInquiryCountForOwner,
} from "@/services/cardAnalyticsRemote";
import {
  fetchCardVisitLogsForOwner,
  fetchCardVisitLogsForPromoterApplicant,
} from "@/services/cardVisitLogsService";
import { fetchMyCardsForUser, type FetchMyCardsResult } from "@/services/cardsService";
import { fetchMyDesignRequests, updateDesignRequestRemote } from "@/services/designRequestsService";
import { fetchReservationsForCardIds, type ReservationRow } from "@/services/reservationsService";
import {
  aggregateRewardBalances,
  confirmedAvailableForWithdrawal,
  createWithdrawalRequestRemote,
  fetchPendingClawbacksSum,
  fetchReferralRewardsForReferrer,
  recordPaymentAndReferralReward,
  type ReferralRewardRow,
} from "@/services/referralRewardsService";
import {
  claimPendingReferral,
  fetchProfileReferralCode,
  fetchReferralClickCount,
  fetchReferralSignupCount,
} from "@/services/referralService";
import {
  buildPromoterCode,
  buildPromotionUrl,
  fetchPromotionApplicationsForApplicant,
  fetchPromotionApplicationsForOwner,
  PROMOTION_LINK_PRICE,
  startPromotionLinkPayment,
  updatePromotionApplicationRemote,
} from "@/services/promotionService";
import {
  buildHelperCampaignStatsComputed,
  fetchApplicationsForCampaign,
  fetchCardEventsLeanForCampaign,
  fetchConsultationsAggregatesForCampaign,
  fetchHelperCampaignsForOwner,
  fetchHelperPartnersByIds,
  fetchShareLinksForCampaign,
  insertPaidHelperCampaignDraft,
} from "@/services/helperCampaignPartnerService";
import { HELPER_LINK_PAYMENT_CTA, HELPER_LINK_PAYMENT_LEAD } from "@/lib/helperLinkPricing";
import type {
  HelperCampaignRow,
  HelperCampaignStatsComputed,
  HelperPartnerApplicationRow,
} from "@/types/helperCampaignPartner";
import { useAuthStore } from "@/stores/authStore";
import { useAppDataStore } from "@/stores/appDataStore";
import type { BusinessCard, CardVisitLog, PromotionApplication, User } from "@/types/domain";
import QRCode from "qrcode";
import { Share2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const CARD_MONTHLY_PRICE = 14900;
const MIN_WITHDRAWAL_KRW = 10000;

/** 카드별 우선 표시할 고객 유입 링크 캠페인 (draft 최우선 → recruiting → active → completed) */
function pickPrimaryHelperCampaignForCard(rows: HelperCampaignRow[], cardId: string): HelperCampaignRow | null {
  const list = rows.filter((c) => c.card_id === cardId && c.status !== "canceled");
  if (!list.length) return null;
  const drafts = list.filter((c) => c.status === "draft");
  if (drafts.length > 0) {
    return [...drafts].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];
  }
  const order: Record<string, number> = { recruiting: 0, active: 1, completed: 2 };
  return [...list].sort((a, b) => {
    const ao = order[a.status] ?? 9;
    const bo = order[b.status] ?? 9;
    if (ao !== bo) return ao - bo;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  })[0];
}

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
  onClick,
}: {
  label: string;
  value: string;
  sub?: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <div className="text-sm font-medium text-slate-600">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
      {sub ? <div className="mt-1 text-sm text-slate-500">{sub}</div> : null}
    </>
  );
  const cls = cn(
    "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/5",
    onClick && "cursor-pointer text-left transition hover:shadow-md",
  );
  if (onClick) {
    return (
      <button type="button" className={cls} onClick={onClick}>
        {inner}
      </button>
    );
  }
  return <div className={cls}>{inner}</div>;
}

/** 내 공간 — 성과 대시보드 지표 카드 */
function PerformanceStatCard({
  label,
  hint,
  value,
}: {
  label: string;
  hint: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/90 p-4 shadow-sm ring-1 ring-slate-900/[0.04] sm:p-5">
      <p className="text-sm font-bold text-slate-900">{label}</p>
      <p className="mt-1 text-[11px] font-medium leading-snug text-slate-500 sm:text-xs">{hint}</p>
      <p className="mt-3 text-3xl font-extrabold tabular-nums tracking-tight text-brand-900">{value}</p>
    </div>
  );
}

function cardDisplayName(card: BusinessCard): string {
  return card.person_name.trim() || card.brand_name.trim() || "이름 없는 명함";
}

function cardSubline(card: BusinessCard): string {
  return [card.job_title.trim(), card.brand_name.trim()].filter(Boolean).join(" · ") || "직업/회사명 미입력";
}

function cardIntroPreview(card: BusinessCard): string {
  const t = card.intro?.trim() ?? "";
  if (!t) return "소개 문구가 아직 없어요.";
  if (t.length > 140) return `${t.slice(0, 137)}…`;
  return t;
}

function cardBelongsToUser(card: BusinessCard, user: User | null): boolean {
  if (!user) return false;
  const email = user.email.trim().toLowerCase();
  return (
    card.user_id === user.id ||
    card.owner_id === user.id ||
    Boolean(email && (card.owner_email?.trim().toLowerCase() === email || card.email?.trim().toLowerCase() === email))
  );
}

function defaultExpireAt(createdAt: string): string {
  const d = new Date(createdAt);
  d.setDate(d.getDate() + 30);
  return d.toISOString();
}

function cardAccessInfo(card: BusinessCard) {
  const expireAt = card.expire_at ?? defaultExpireAt(card.created_at);
  const msLeft = new Date(expireAt).getTime() - Date.now();
  const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
  const expired = msLeft <= 0 || card.status === "expired" || card.status === "payment_required";
  return {
    expired,
    daysLeft,
    expireAt,
    statusLabel: expired ? "만료됨 · 결제 필요" : `사용중 · ${daysLeft}일 남음`,
  };
}

function buildPromotionLink(card: BusinessCard, origin: string, refCode: string): string {
  const publicUrl = buildCardShareUrl(origin, card.slug ?? "") ?? "";
  if (!publicUrl || !refCode) return publicUrl;
  try {
    const u = new URL(publicUrl);
    u.searchParams.set("ref", refCode);
    return u.toString();
  } catch {
    return `${publicUrl}${publicUrl.includes("?") ? "&" : "?"}ref=${encodeURIComponent(refCode)}`;
  }
}

function formatPromotionVisitDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "—";
  }
}

function promoterPerformanceRows(
  card: BusinessCard,
  logs: CardVisitLog[],
  applications: PromotionApplication[],
  origin: string,
  labelFor: (a: PromotionApplication) => { name: string; email: string },
): Array<{
  rank: number;
  promoter_code: string;
  label: string;
  visits: number;
  lastVisited: string | null;
  promotionLink: string;
}> {
  const approved = applications.filter((a) => a.card_id === card.id && a.status === "approved" && a.promoter_code);
  const slug = card.slug?.trim() ?? "";
  const grouped = new Map<string, { visits: number; last: string | null }>();
  for (const l of logs) {
    if (l.card_id !== card.id || !l.promoter_code) continue;
    const code = l.promoter_code;
    const g = grouped.get(code) ?? { visits: 0, last: null };
    g.visits += 1;
    const t = l.visited_at;
    if (!g.last || new Date(t) > new Date(g.last)) g.last = t;
    grouped.set(code, g);
  }
  const rows = approved.map((app) => {
    const code = app.promoter_code!;
    const g = grouped.get(code);
    const lbl = labelFor(app);
    const label = [lbl.name, lbl.email].filter(Boolean).join(" · ") || app.applicant_user_id;
    return {
      promoter_code: code,
      label,
      visits: g?.visits ?? 0,
      lastVisited: g?.last ?? null,
      promotionLink: slug ? buildPromotionUrl(origin, slug, code) : "",
    };
  });
  rows.sort((a, b) => b.visits - a.visits);
  return rows.map((r, i) => ({
    rank: i + 1,
    ...r,
  }));
}

export function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const businessCards = useAppDataStore((s) => s.businessCards);
  const cardViews = useAppDataStore((s) => s.cardViews);
  const cardClicks = useAppDataStore((s) => s.cardClicks);
  const cardLinkVisits = useAppDataStore((s) => s.cardLinkVisits);
  const cardPromotionLinks = useAppDataStore((s) => s.cardPromotionLinks);
  const requests = useAppDataStore((s) => s.serviceRequests);
  const designRequests = useAppDataStore((s) => s.designRequests);
  const applications = useAppDataStore((s) => s.applications);
  const referralRecords = useAppDataStore((s) => s.referralRecords);
  const promotionApplications = useAppDataStore((s) => s.promotionApplications);
  const platformUsers = useAppDataStore((s) => s.platformUsers);
  const creators = useAppDataStore((s) => s.creators);
  const expertDirectRequests = useAppDataStore((s) => s.expertDirectRequests);
  const ensureReferralRecord = useAppDataStore((s) => s.ensureReferralRecord);
  const upsertBusinessCard = useAppDataStore((s) => s.upsertBusinessCard);
  const addPayment = useAppDataStore((s) => s.addPayment);
  const extendCardAccess = useAppDataStore((s) => s.extendCardAccess);
  const setDesignRequests = useAppDataStore((s) => s.setDesignRequests);
  const updateDesignRequest = useAppDataStore((s) => s.updateDesignRequest);
  const setPromotionApplications = useAppDataStore((s) => s.setPromotionApplications);
  const updatePromotionApplication = useAppDataStore((s) => s.updatePromotionApplication);
  const [cardCopyId, setCardCopyId] = useState<string | null>(null);
  const [nfcCopyCardId, setNfcCopyCardId] = useState<string | null>(null);
  const [promoCopyId, setPromoCopyId] = useState<string | null>(null);
  const [cardShareHintId, setCardShareHintId] = useState<string | null>(null);
  const [referralLinkCopiedFlash, setReferralLinkCopiedFlash] = useState(false);
  const [referralMessageCopiedFlash, setReferralMessageCopiedFlash] = useState(false);
  const [referralPromoCopiedFlash, setReferralPromoCopiedFlash] = useState(false);
  const [qrCard, setQrCard] = useState<BusinessCard | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrLink, setQrLink] = useState("");
  const [promotionPaymentCard, setPromotionPaymentCard] = useState<BusinessCard | null>(null);
  const [extraCardModalOpen, setExtraCardModalOpen] = useState(false);
  const [extraCardBusy, setExtraCardBusy] = useState(false);
  const [visitLogs, setVisitLogs] = useState<CardVisitLog[]>([]);
  const [promoterVisitLogs, setPromoterVisitLogs] = useState<CardVisitLog[]>([]);
  const [cardsFetch, setCardsFetch] = useState<FetchMyCardsResult>({
    status: "ok",
    cards: [],
    source: "none",
  });
  const [cardsLoading, setCardsLoading] = useState(false);
  const [profileReferralCodeDb, setProfileReferralCodeDb] = useState<string | null>(null);
  const [referralSignupCountDb, setReferralSignupCountDb] = useState<number | null>(null);
  const [referralClickCountDb, setReferralClickCountDb] = useState<number | null>(null);
  const [referralRewardRows, setReferralRewardRows] = useState<ReferralRewardRow[]>([]);
  const [cardJustSavedBanner, setCardJustSavedBanner] = useState(false);
  const [rewardClawbackPending, setRewardClawbackPending] = useState(0);
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);
  const [withdrawalBankName, setWithdrawalBankName] = useState("");
  const [withdrawalBankAccount, setWithdrawalBankAccount] = useState("");
  const [withdrawalAccountHolder, setWithdrawalAccountHolder] = useState("");
  const [withdrawalSelectedIds, setWithdrawalSelectedIds] = useState<string[]>([]);
  const [withdrawalBusy, setWithdrawalBusy] = useState(false);
  const [withdrawalError, setWithdrawalError] = useState<string | null>(null);
  const [ownerReservations, setOwnerReservations] = useState<ReservationRow[]>([]);
  const [remoteViewSum, setRemoteViewSum] = useState<number | null>(null);
  const [remoteActionSum, setRemoteActionSum] = useState<number | null>(null);
  const [remoteInquirySum, setRemoteInquirySum] = useState<number | null>(null);

  const [helperCampaignRows, setHelperCampaignRows] = useState<HelperCampaignRow[]>([]);
  const [helperCampaignApps, setHelperCampaignApps] = useState<Record<string, HelperPartnerApplicationRow[]>>({});
  const [helperCampaignMetrics, setHelperCampaignMetrics] = useState<Record<string, HelperCampaignStatsComputed>>({});
  const [helperCampaignPerfBusy, setHelperCampaignPerfBusy] = useState(false);

  const uid = user?.id ?? "";
  useEffect(() => {
    const st = location.state as { openExtraCardModal?: boolean } | null | undefined;
    if (st?.openExtraCardModal) {
      setExtraCardModalOpen(true);
      navigate("/dashboard", { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  useEffect(() => {
    const st = location.state as Partial<Record<string, unknown>> | null | undefined;
    if (st?.[SHOW_PENDING_CARD_SAVED_STATE]) {
      setCardJustSavedBanner(true);
      navigate(".", { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  useEffect(() => {
    if (!cardJustSavedBanner) return;
    const t = window.setTimeout(() => setCardJustSavedBanner(false), 14000);
    return () => window.clearTimeout(t);
  }, [cardJustSavedBanner]);

  useEffect(() => {
    if (uid) ensureReferralRecord(uid);
  }, [ensureReferralRecord, uid]);

  useEffect(() => {
    if (!uid) {
      setProfileReferralCodeDb(null);
      setReferralSignupCountDb(null);
      setReferralClickCountDb(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      await claimPendingReferral();
      const [code, count, clicks] = await Promise.all([
        fetchProfileReferralCode(uid),
        fetchReferralSignupCount(uid),
        fetchReferralClickCount(uid),
      ]);
      if (cancelled) return;
      setProfileReferralCodeDb(code);
      setReferralSignupCountDb(count);
      setReferralClickCountDb(clicks);
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const reloadReferralRewards = useCallback(async () => {
    if (!uid) {
      setReferralRewardRows([]);
      setRewardClawbackPending(0);
      setReferralClickCountDb(null);
      return;
    }
    const [rows, claw, clicks] = await Promise.all([
      fetchReferralRewardsForReferrer(uid),
      fetchPendingClawbacksSum(uid),
      fetchReferralClickCount(uid),
    ]);
    setReferralRewardRows(rows);
    setRewardClawbackPending(claw);
    setReferralClickCountDb(clicks);
  }, [uid]);

  const reloadHelperCampaignBoard = useCallback(async () => {
    if (!uid || !isSupabaseConfigured) {
      setHelperCampaignRows([]);
      setHelperCampaignApps({});
      setHelperCampaignMetrics({});
      return;
    }
    setHelperCampaignPerfBusy(true);
    const rows = await fetchHelperCampaignsForOwner(uid);
    setHelperCampaignRows(rows);
    const appMap: Record<string, HelperPartnerApplicationRow[]> = {};
    const partnerIds = new Set<string>();
    for (const row of rows) {
      const apps = await fetchApplicationsForCampaign(row.id);
      appMap[row.id] = apps;
      for (const app of apps) partnerIds.add(app.partner_id);
    }
    setHelperCampaignApps(appMap);
    const partners = await fetchHelperPartnersByIds([...partnerIds]);
    const partnerMapObj = Object.fromEntries(partners.map((p) => [p.id, p]));

    const metricsEntries = await Promise.all(
      rows.map(async (row) => {
        const apps = appMap[row.id] ?? [];
        const [events, links, consult] = await Promise.all([
          fetchCardEventsLeanForCampaign(row.id),
          fetchShareLinksForCampaign(row.id),
          fetchConsultationsAggregatesForCampaign(row.id),
        ]);
        const built = buildHelperCampaignStatsComputed({
          events,
          shareLinks: links,
          consultationTotal: consult.total,
          consultationByPartnerId: consult.byPartnerId,
          applications: apps,
          partnersById: partnerMapObj,
        });
        return [row.id, built] as const;
      }),
    );
    setHelperCampaignMetrics(Object.fromEntries(metricsEntries));
    setHelperCampaignPerfBusy(false);
  }, [uid]);

  useEffect(() => {
    void reloadReferralRewards();
  }, [reloadReferralRewards]);

  useEffect(() => {
    void reloadHelperCampaignBoard();
  }, [reloadHelperCampaignBoard]);

  useEffect(() => {
    if (!user?.id) return;
    console.info("[DashboardPage] auth user", {
      id: user.id,
      email: user.email,
    });
    let cancelled = false;
    setCardsLoading(true);
    void fetchMyCardsForUser({ id: user.id, email: user.email }).then((result) => {
      if (cancelled) return;
      setCardsFetch(result);
      setCardsLoading(false);
      console.info("[DashboardPage] business_cards lookup", {
        authUserId: user.id,
        email: user.email,
        status: result.status,
        source: result.source,
        count: result.cards.length,
        error: result.error ?? null,
        owners: result.cards.slice(0, 5).map((card) => ({
          id: card.id,
          user_id: card.user_id,
          owner_id: card.owner_id ?? null,
          email: card.email ?? null,
          owner_email: card.owner_email ?? null,
        })),
      });
      for (const card of result.cards) upsertBusinessCard(card);
    });
    return () => {
      cancelled = true;
    };
  }, [user, upsertBusinessCard]);

  useEffect(() => {
    if (!user?.id) return;
    void fetchMyDesignRequests({ id: user.id, email: user.email }).then((rows) => {
      if (rows) setDesignRequests(rows);
    });
  }, [setDesignRequests, user?.email, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    void Promise.all([
      fetchPromotionApplicationsForOwner(user.id),
      fetchPromotionApplicationsForApplicant(user.id),
    ]).then(([ownerRows, applicantRows]) => {
      const rows = [...(ownerRows ?? []), ...(applicantRows ?? [])];
      if (rows.length) setPromotionApplications(rows);
    });
  }, [setPromotionApplications, user?.id]);

  useEffect(() => {
    if (!uid) {
      setVisitLogs([]);
      return;
    }
    let cancelled = false;
    void fetchCardVisitLogsForOwner(uid).then((logs) => {
      if (cancelled) return;
      setVisitLogs(logs ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const myCards = useMemo(
    () => (uid ? businessCards.filter((card) => cardBelongsToUser(card, user)) : []),
    [businessCards, uid, user],
  );

  useEffect(() => {
    if (!uid || myCards.length === 0) {
      setRemoteViewSum(null);
      setRemoteActionSum(null);
      setRemoteInquirySum(null);
      return;
    }
    let cancelled = false;
    const ids = myCards.map((c) => c.id);
    void (async () => {
      const [rv, ra, ri] = await Promise.all([
        fetchRemoteCardViewCountForCards(ids),
        fetchRemoteActionCountForOwner(uid),
        fetchRemoteInquiryCountForOwner(uid),
      ]);
      if (cancelled) return;
      setRemoteViewSum(rv);
      setRemoteActionSum(ra);
      setRemoteInquirySum(ri);
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, myCards]);
  const shareOrigin = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    if (!uid || !isSupabaseConfigured || myCards.length === 0) {
      setOwnerReservations([]);
      return;
    }
    let cancelled = false;
    const ids = myCards.map((c) => c.id);
    void fetchReservationsForCardIds(ids).then((rows) => {
      if (!cancelled) setOwnerReservations(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [uid, myCards]);

  const todayYmd = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const reservationsToday = useMemo(
    () => ownerReservations.filter((r) => r.reservation_date === todayYmd && r.status !== "cancelled"),
    [ownerReservations, todayYmd],
  );
  const reservationsWaiting = useMemo(
    () => ownerReservations.filter((r) => r.status === "pending"),
    [ownerReservations],
  );
  const reservationsDone = useMemo(
    () => ownerReservations.filter((r) => r.status === "completed"),
    [ownerReservations],
  );

  const promoteOrigin = canonicalSiteOrigin();
  const myCardIds = useMemo(() => new Set(myCards.map((c) => c.id)), [myCards]);

  const viewsCount = cardViews.filter((v) => myCardIds.has(v.card_id)).length;
  const clicksCount = cardClicks.filter((c) => myCardIds.has(c.card_id)).length;

  /** 전화·메일·카카오 등 상담 성격 클릭 */
  const inquiryClickCount = useMemo(
    () =>
      cardClicks.filter(
        (c) => myCardIds.has(c.card_id) && ["phone", "email", "kakao"].includes(c.action_type),
      ).length,
    [cardClicks, myCardIds],
  );

  /** Supabase 등 서버에 남는 공개 명함 방문 로그 */
  const serverVisitCount = useMemo(
    () => visitLogs.filter((l) => myCardIds.has(l.card_id)).length,
    [visitLogs, myCardIds],
  );

  const promoLinkInboundCount = useMemo(
    () => cardLinkVisits.filter((v) => myCardIds.has(v.card_id)).length,
    [cardLinkVisits, myCardIds],
  );

  const viewsDisplay = remoteViewSum ?? viewsCount;
  const clicksDisplay = remoteActionSum ?? clicksCount;
  const inquiriesDisplay = remoteInquirySum ?? inquiryClickCount;

  const hasPerformanceSignal =
    viewsDisplay > 0 ||
    clicksDisplay > 0 ||
    inquiriesDisplay > 0 ||
    promoLinkInboundCount > 0 ||
    serverVisitCount > 0;

  const myOpenRequests = uid
    ? requests.filter((r) => r.client_user_id === uid && r.status === "open").length
    : 0;
  const myDesignRequests = useMemo(() => {
    if (!uid) return [];
    const email = user?.email.trim().toLowerCase() ?? "";
    return designRequests
      .filter((request) => request.user_id === uid || (email && request.email.trim().toLowerCase() === email))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [designRequests, uid, user?.email]);

  const myApps = uid ? applications.filter((a) => a.creator_user_id === uid) : [];
  const ownerPromotionApplications = useMemo(
    () => (uid ? promotionApplications.filter((application) => application.owner_user_id === uid) : []),
    [promotionApplications, uid],
  );
  const approvedPromotions = useMemo(
    () =>
      uid
        ? promotionApplications.filter(
            (application) =>
              application.applicant_user_id === uid && application.status === "approved" && application.promoter_code,
          )
        : [],
    [promotionApplications, uid],
  );

  const myExpertProfileIds = useMemo(() => {
    if (!uid) return new Set<string>();
    return new Set(creators.filter((c) => c.user_id === uid).map((c) => c.id));
  }, [creators, uid]);

  const expertLookup = useMemo(() => new Map(creators.map((c) => [c.id, c])), [creators]);

  const mySentExpertRequests = useMemo(() => {
    if (!uid) return [];
    return expertDirectRequests
      .filter((r) => r.requester_id === uid)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [expertDirectRequests, uid]);

  const myReceivedExpertRequests = useMemo(() => {
    if (myExpertProfileIds.size === 0) return [];
    return expertDirectRequests
      .filter((r) => myExpertProfileIds.has(r.expert_id))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [expertDirectRequests, myExpertProfileIds]);

  const promoterCodesForMe = useMemo(
    () =>
      approvedPromotions
        .map((a) => a.promoter_code)
        .filter((c): c is string => Boolean(c)),
    [approvedPromotions],
  );

  const promoterCodesKey = promoterCodesForMe.join("|");

  useEffect(() => {
    if (!uid || promoterCodesForMe.length === 0) {
      setPromoterVisitLogs([]);
      return;
    }
    let cancelled = false;
    void fetchCardVisitLogsForPromoterApplicant(uid, promoterCodesForMe).then((logs) => {
      if (cancelled) return;
      setPromoterVisitLogs(logs ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [uid, promoterCodesKey]);

  const isCreator = user?.role === "creator";
  const displayName = safeDisplayName(user);

  const scrollToMyCardsSection = useCallback(() => {
    document.getElementById("dashboard-section-my-cards")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const onMyCardsStatClick = useCallback(() => {
    scrollToMyCardsSection();
    window.setTimeout(() => {
      if (myCards.length === 1) {
        document.getElementById(`dashboard-card-${myCards[0].id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (myCards.length === 0 && !isCreator) {
        document.getElementById("dashboard-empty-card-cta")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 450);
  }, [myCards, isCreator, scrollToMyCardsSection]);

  const openPublicCardPage = useCallback(
    (card: BusinessCard) => {
      const slug = card.slug?.trim();
      if (!slug || slug.length < 2) return;
      navigate(`/c/${encodeURIComponent(slug)}`);
    },
    [navigate],
  );

  const handleDashboardCardSurfaceClick = useCallback(
    (e: MouseEvent<HTMLLIElement>, card: BusinessCard) => {
      if ((e.target as HTMLElement).closest("[data-dashboard-card-stop]")) return;
      openPublicCardPage(card);
    },
    [openPublicCardPage],
  );

  const myReferral = uid ? referralRecords.find((r) => r.user_id === uid) : null;
  const refCode =
    profileReferralCodeDb?.trim() ||
    myReferral?.ref_code ||
    (uid ? buildReferralCode(uid) : "");
  const referredCount = referralSignupCountDb ?? myReferral?.referred_count ?? 0;
  const rewardMonths = rewardMonthsForReferralCount(referredCount);
  const referralLink = refCode ? buildSignupReferralUrl(refCode) : "";

  const referralPaymentConversionCount = useMemo(
    () => referralRewardRows.filter((r) => r.status !== "cancelled").length,
    [referralRewardRows],
  );

  const referralRewardBalances = useMemo(
    () => aggregateRewardBalances(referralRewardRows, rewardClawbackPending),
    [referralRewardRows, rewardClawbackPending],
  );

  const confirmedSelectableRewards = useMemo(
    () => confirmedAvailableForWithdrawal(referralRewardRows),
    [referralRewardRows],
  );

  const withdrawalSelectedSum = useMemo(() => {
    const sel = new Set(withdrawalSelectedIds);
    return referralRewardRows.filter((r) => sel.has(r.id)).reduce((s, r) => s + r.reward_amount, 0);
  }, [referralRewardRows, withdrawalSelectedIds]);

  const copyReferralLink = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setReferralLinkCopiedFlash(true);
      window.setTimeout(() => setReferralLinkCopiedFlash(false), 4000);
    } catch {
      window.prompt("추천 링크를 복사해 주세요", referralLink);
    }
  };

  const copyReferralMessage = async () => {
    if (!referralLink) return;
    const text = buildReferralShareMessageText(referralLink);
    try {
      await navigator.clipboard.writeText(text);
      setReferralMessageCopiedFlash(true);
      window.setTimeout(() => setReferralMessageCopiedFlash(false), 5000);
    } catch {
      window.prompt("추천 문구를 복사해 주세요", text);
    }
  };

  const saveReferralPromoImage = async () => {
    try {
      await downloadReferralPromoImage();
    } catch {
      window.alert("이미지를 저장하지 못했습니다. 브라우저 설정 또는 네트워크를 확인해 주세요.");
    }
  };

  const pasteReferralPromoImage = async () => {
    const result = await copyReferralPromoImage();
    if (result === "ok") {
      setReferralPromoCopiedFlash(true);
      window.setTimeout(() => setReferralPromoCopiedFlash(false), 5000);
      return;
    }
    window.alert("이 브라우저에서는 이미지 복사가 어렵습니다. 홍보 이미지 저장하기를 이용해 주세요.");
    try {
      await downloadReferralPromoImage();
    } catch {
      /* ignore duplicate alert */
    }
  };

  const copyCardLink = async (card: BusinessCard) => {
    const url = resolveBusinessCardPublicUrl(card, shareOrigin) ?? "";
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("내 명함 링크를 복사해 주세요", url);
    }
    setCardCopyId(card.id);
    window.setTimeout(() => setCardCopyId(null), 4000);
  };

  const copyNfcLink = async (card: BusinessCard) => {
    const url = buildNfcAcceptUrl(card.id);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("NFC 링크를 복사해 주세요", url);
    }
    setNfcCopyCardId(card.id);
    window.setTimeout(() => setNfcCopyCardId(null), 2200);
  };

  const payForCardExtension = async (card: BusinessCard) => {
    if (!uid) return;
    if (!window.confirm(`${CARD_MONTHLY_PRICE.toLocaleString()}원 결제 후 이 명함을 한 달 연장할까요?`)) {
      return;
    }
    await recordPaymentAndReferralReward({
      planType: "card_month_extension",
      amount: CARD_MONTHLY_PRICE,
    });
    addPayment({
      id: crypto.randomUUID(),
      user_id: uid,
      card_id: card.id,
      amount: CARD_MONTHLY_PRICE,
      payment_type: "card_month_extension",
      status: "completed",
      created_at: new Date().toISOString(),
    });
    extendCardAccess(card.id, 1);
    void reloadReferralRewards();
  };

  const confirmExtraCardPurchase = async () => {
    if (!uid || !user) return;
    setExtraCardBusy(true);
    try {
      const paid = await startExtraCardPayment();
      if (!paid) return;
      const card = await createAdditionalCard({
        userId: uid,
        userEmail: user.email,
        userName: user.name,
        existingCards: myCards,
        upsertBusinessCard,
      });
      await handleExtraCardPaymentSuccess({ userId: uid, cardId: card.id });
      await recordPaymentAndReferralReward({
        planType: "extra_card",
        amount: EXTRA_CARD_PRICE,
      });
      addPayment({
        id: crypto.randomUUID(),
        user_id: uid,
        card_id: card.id,
        amount: EXTRA_CARD_PRICE,
        payment_type: "extra_card",
        status: "completed",
        created_at: new Date().toISOString(),
      });
      void reloadReferralRewards();
      setExtraCardModalOpen(false);
      navigate(`/cards/${encodeURIComponent(card.id)}/edit`);
    } finally {
      setExtraCardBusy(false);
    }
  };

  const openHelperCampaignPrimaryAction = useCallback(
    (card: BusinessCard, cm: HelperCampaignRow | null | undefined) => {
      if (cm?.status === "draft") {
        navigate(`/helperlink/create?campaignId=${encodeURIComponent(cm.id)}`);
        return;
      }
      if (cm && cm.status !== "canceled") {
        if (cm.status === "recruiting") {
          navigate(`/dashboard/helper-campaigns/${encodeURIComponent(cm.id)}/applications`);
          return;
        }
        if (cm.status === "active" || cm.status === "completed") {
          navigate(`/dashboard/helper-campaigns/${encodeURIComponent(cm.id)}/stats`);
          return;
        }
      }
      if (card.promotion_enabled && !cm) {
        document.getElementById("dashboard-section-helper-mgmt")?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      setPromotionPaymentCard(card);
    },
    [navigate],
  );

  const confirmPromotionPayment = async () => {
    if (!promotionPaymentCard || !uid) return;
    await startPromotionLinkPayment(promotionPaymentCard.id);
    const paymentUuid = crypto.randomUUID();
    const draft = await insertPaidHelperCampaignDraft({
      ownerId: uid,
      cardId: promotionPaymentCard.id,
      paymentId: paymentUuid,
    });
    await recordPaymentAndReferralReward({
      planType: "promotion_link",
      amount: PROMOTION_LINK_PRICE,
    });
    addPayment({
      id: crypto.randomUUID(),
      user_id: uid,
      card_id: promotionPaymentCard.id,
      amount: PROMOTION_LINK_PRICE,
      payment_type: "promotion_link_enable",
      status: "completed",
      created_at: new Date().toISOString(),
    });
    void reloadReferralRewards();
    setPromotionPaymentCard(null);
    await reloadHelperCampaignBoard();
    if (draft?.id) {
      navigate(`/helperlink/create?campaignId=${encodeURIComponent(draft.id)}`);
    } else {
      window.alert(
        "결제는 기록했지만 고객 유입 링크 초안 생성에 실패했습니다. Supabase helper_campaigns 마이그레이션을 확인해 주세요.",
      );
    }
  };

  const openWithdrawalModal = () => {
    setWithdrawalSelectedIds(confirmedSelectableRewards.map((r) => r.id));
    setWithdrawalBankName("");
    setWithdrawalBankAccount("");
    setWithdrawalAccountHolder("");
    setWithdrawalError(null);
    setWithdrawalModalOpen(true);
  };

  const toggleWithdrawalReward = (id: string) => {
    setWithdrawalSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const submitWithdrawalRequest = async () => {
    setWithdrawalError(null);
    if (withdrawalSelectedSum < MIN_WITHDRAWAL_KRW) {
      setWithdrawalError(`최소 ${MIN_WITHDRAWAL_KRW.toLocaleString()}원 이상 선택해 주세요.`);
      return;
    }
    if (!withdrawalBankName.trim() || !withdrawalBankAccount.trim() || !withdrawalAccountHolder.trim()) {
      setWithdrawalError("은행명·계좌번호·예금주를 모두 입력해 주세요.");
      return;
    }
    setWithdrawalBusy(true);
    try {
      const res = await createWithdrawalRequestRemote({
        rewardIds: withdrawalSelectedIds,
        bankName: withdrawalBankName.trim(),
        bankAccount: withdrawalBankAccount.trim(),
        accountHolder: withdrawalAccountHolder.trim(),
      });
      if (!res.ok) {
        setWithdrawalError(res.message ?? "출금 신청에 실패했습니다.");
        return;
      }
      setWithdrawalModalOpen(false);
      await reloadReferralRewards();
    } finally {
      setWithdrawalBusy(false);
    }
  };

  const applicantLabel = (application: PromotionApplication): { name: string; email: string } => {
    const platformUser = platformUsers.find((u) => u.id === application.applicant_user_id);
    return {
      name: application.applicant_name ?? platformUser?.name ?? "지원자",
      email: application.applicant_email ?? platformUser?.email ?? application.applicant_user_id,
    };
  };

  const visitOwnerStats = useMemo(() => {
    const totalVisits = visitLogs.length;
    const promotionVisits = visitLogs.filter((l) => l.source === "promotion").length;
    const directVisits = visitLogs.filter((l) => l.source === "direct").length;
    const codes = new Set(visitLogs.map((l) => l.promoter_code).filter(Boolean));
    const promoterCount = codes.size;
    const byCode = new Map<string, number>();
    for (const l of visitLogs) {
      if (!l.promoter_code) continue;
      byCode.set(l.promoter_code, (byCode.get(l.promoter_code) ?? 0) + 1);
    }
    let topCode: string | null = null;
    let topCount = 0;
    for (const [code, count] of byCode) {
      if (count > topCount) {
        topCount = count;
        topCode = code;
      }
    }
    return { totalVisits, promotionVisits, directVisits, promoterCount, topCode, topCount };
  }, [visitLogs]);

  const topPromoterDisplay = useMemo(() => {
    const code = visitOwnerStats.topCode;
    if (!code || visitOwnerStats.topCount === 0) return "—";
    const app = ownerPromotionApplications.find((a) => a.promoter_code === code);
    if (!app) return `${code} (${visitOwnerStats.topCount}회)`;
    const platformUser = platformUsers.find((u) => u.id === app.applicant_user_id);
    const name = app.applicant_name ?? platformUser?.name ?? "지원자";
    return `${name} (${visitOwnerStats.topCount}회)`;
  }, [visitOwnerStats, ownerPromotionApplications, platformUsers]);

  const decidePromotionApplication = async (application: PromotionApplication, status: "approved" | "rejected") => {
    const card = businessCards.find((c) => c.id === application.card_id);
    const promoterCode = status === "approved" ? application.promoter_code ?? buildPromoterCode(application.card_id, application.applicant_user_id) : application.promoter_code;
    const promotionUrl =
      status === "approved" && card?.slug ? buildPromotionUrl(promoteOrigin, card.slug, promoterCode ?? "") : application.promotion_url;
    const lbl = applicantLabel(application);
    const patch: Partial<PromotionApplication> = {
      status,
      promoter_code: promoterCode ?? null,
      promotion_url: promotionUrl ?? null,
      approved_at: status === "approved" ? new Date().toISOString() : application.approved_at,
      applicant_name: lbl.name,
      applicant_email: lbl.email.includes("@") ? lbl.email : application.applicant_email ?? null,
    };
    updatePromotionApplication(application.id, patch);
    await updatePromotionApplicationRemote(application.id, patch);
  };

  const copyPromotionLink = async (promoUrl: string, key: string) => {
    if (!promoUrl) return;
    try {
      await navigator.clipboard.writeText(promoUrl);
    } catch {
      window.prompt("고객 유입 링크를 복사해 주세요", promoUrl);
    }
    setPromoCopyId(key);
    window.setTimeout(() => setPromoCopyId(null), 2200);
  };

  const sharePromotionLink = async (card: BusinessCard, promoUrl: string) => {
    if (!promoUrl) return;
    const r = await shareCardLinkNativeOrder({
      shareUrl: promoUrl,
      title: "린코 디지털 명함을 확인해 보세요",
      shortMessage: "링크 하나로 소개부터 상담까지 연결됩니다.",
      kakaoDescription: "링크 하나로 소개부터 상담까지 연결됩니다.",
      kakaoImageUrl: getCardHeroImageUrl(card) || undefined,
      buttonTitle: "명함 보기",
    });
    if (r === "clipboard") {
      setCardShareHintId(card.id);
      window.setTimeout(() => setCardShareHintId(null), 3000);
    }
  };

  const openQr = async (card: BusinessCard, explicitUrl?: string) => {
    const qrUrl = explicitUrl ?? resolveBusinessCardPublicUrl(card, shareOrigin) ?? "";
    console.log("[QR URL]", qrUrl);
    console.log("[CARD SLUG]", card.slug);
    console.log("[CARD PUBLIC URL]", card.publicUrl);
    if (!qrUrl) return;
    setQrCard(card);
    setQrLink(qrUrl);
    try {
      const dataUrl = await QRCode.toDataURL(qrUrl, {
        margin: 1,
        width: 220,
        color: { dark: "#0f172a", light: "#ffffff" },
      });
      setQrDataUrl(dataUrl);
    } catch {
      setQrDataUrl(null);
    }
  };

  const cardsLookupFailed = myCards.length === 0 && (cardsFetch.status === "error" || cardsFetch.status === "not_configured");
  const cardsActuallyEmpty = !cardsLoading && !cardsLookupFailed && myCards.length === 0;

  const changeDesignRequestStatus = async (requestId: string, status: "revision_requested" | "completed") => {
    const patch = { status, updated_at: new Date().toISOString() };
    updateDesignRequest(requestId, patch);
    await updateDesignRequestRemote(requestId, patch);
  };

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
          <p className="mt-2 text-base leading-relaxed text-slate-600">
            만들고 · 공유하고 · 성과를 확인하고 · 다시 공유하는 흐름이 여기서 이어집니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/requests/new"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-base font-semibold text-slate-900 hover:bg-slate-50 sm:min-h-0 sm:py-2.5"
          >
            의뢰하기
          </Link>
          <Link
            to="/ads/create"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-brand-200 bg-brand-50/90 px-5 text-base font-semibold text-brand-950 hover:bg-brand-100 sm:min-h-0 sm:py-2.5"
          >
            광고 등록
          </Link>
          <Link
            to="/ads/dashboard"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-base font-semibold text-slate-900 hover:bg-slate-50 sm:min-h-0 sm:py-2.5"
          >
            내 광고 통계
          </Link>
        </div>
      </div>

      {cardJustSavedBanner ? (
        <div
          role="status"
          className="mt-8 rounded-2xl border border-emerald-300/70 bg-emerald-50 px-5 py-4 text-sm leading-relaxed text-emerald-950 shadow-sm shadow-emerald-900/10"
        >
          <p className="font-bold text-emerald-950">명함이 저장되었습니다.</p>
          <p className="mt-1 font-medium">
            이제 내 공간에서 링크를 복사하고 홍보할 수 있습니다.
          </p>
        </div>
      ) : null}

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
            sub="클릭하면 만든 명함을 확인할 수 있어요"
            onClick={onMyCardsStatClick}
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
            sub="클릭하면 만든 명함을 확인할 수 있어요 · 제작 전문가 계정으로 만든 명함이에요"
            onClick={onMyCardsStatClick}
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
          <StatBlock
            key="client-requests"
            label="진행 중 의뢰"
            value={String(myOpenRequests + myDesignRequests.filter((r) => r.status !== "completed").length)}
          />
        )}
      </div>

      <section id="dashboard-section-my-cards" className="mt-10 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
              {cardsActuallyEmpty && !cardsLoading && !cardsLookupFailed ? "아직 만든 명함이 없어요" : "내 명함"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
              {cardsLoading
                ? "명함 정보를 불러오는 중이에요."
                : cardsLookupFailed
                  ? "명함을 불러오지 못했을 때는 아래 안내를 확인해 주세요."
                  : cardsActuallyEmpty
                    ? "먼저 내 명함을 만들고 링크·QR·NFC로 공유해 보세요."
                    : myCards.length >= 1
                      ? "고객에게 보내는 실제 명함입니다. 수정하고 공유해 보세요."
                      : "명함 정보를 확인하는 중이에요."}
            </p>
            {!cardsActuallyEmpty && !cardsLoading && myCards.length >= 1 ? (
              <p className="mt-2 text-xs text-slate-500">추가 명함은 1개당 10,900원 결제 후 만들 수 있습니다.</p>
            ) : null}
          </div>
          {!isCreator ? (
            cardsActuallyEmpty ? (
              <Link
                to="/cards/new"
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-cta-500 px-4 text-sm font-bold text-white shadow-sm shadow-cta-900/20 hover:bg-cta-600"
              >
                내 명함 만들기
              </Link>
            ) : myCards.length > 0 ? (
              <div className="max-w-xs">
                <button
                  type="button"
                  className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-xl bg-cta-500 px-4 text-sm font-bold text-white shadow-sm shadow-cta-900/20 hover:bg-cta-600 disabled:opacity-60"
                  disabled={extraCardBusy}
                  onClick={() => setExtraCardModalOpen(true)}
                >
                  명함 추가하기
                </button>
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 ring-1 ring-slate-200">
                {cardsLoading ? "명함을 불러오는 중..." : "명함 조회 상태를 확인하는 중..."}
              </div>
            )
          ) : null}
        </div>

        {cardsLoading ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-10 text-center">
            <p className="text-lg font-bold text-slate-900">명함을 불러오는 중입니다.</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
              로그인 계정과 연결된 기존 명함을 확인하고 있어요.
            </p>
          </div>
        ) : cardsLookupFailed ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-10 text-center">
            <p className="text-lg font-bold text-amber-950">명함을 불러오지 못했습니다.</p>
            <p className="mt-2 text-sm leading-relaxed text-amber-900 sm:text-base">
              Supabase 연결 또는 권한 정책을 확인해 주세요. 콘솔에 조회 실패 원인을 남겼습니다.
            </p>
            {cardsFetch.error ? (
              <p className="mx-auto mt-3 max-w-lg break-all rounded-xl bg-white/70 px-3 py-2 text-xs font-medium text-amber-900">
                {cardsFetch.error}
              </p>
            ) : null}
          </div>
        ) : cardsActuallyEmpty ? (
          <div
            id="dashboard-empty-card-cta"
            className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center"
          >
            <p className="text-sm leading-relaxed text-slate-600">
              상단의 <span className="font-semibold text-slate-800">「내 명함 만들기」</span>를 눌러 시작할 수 있어요.
            </p>
          </div>
        ) : (
          <ul className="mt-6 grid gap-4 lg:grid-cols-2">
            {myCards.map((card) => {
              const publicUrl = resolveBusinessCardPublicUrl(card, shareOrigin) ?? "";
              const cardPublicHref = publicUrl.trim();
              const cardViewCount = cardViews.filter((v) => v.card_id === card.id).length;
              const cardClickCount = cardClicks.filter((c) => c.card_id === card.id).length;
              const canEditCard = cardBelongsToUser(card, user);
              const access = cardAccessInfo(card);
              const promotionLinks = [
                { id: `base-${card.id}`, ref_code: refCode, label: "기본 고객 유입 링크" },
                ...cardPromotionLinks
                  .filter((link) => link.card_id === card.id)
                  .map((link, index) => ({
                    id: link.id,
                    ref_code: link.ref_code,
                    label: `추가 고객 유입 링크 ${index + 1}`,
                  })),
              ].filter((link) => link.ref_code);

              const promotionPerfRows = promoterPerformanceRows(
                card,
                visitLogs,
                ownerPromotionApplications,
                promoteOrigin,
                applicantLabel,
              );
              const showPromotionPerf =
                Boolean(card.promotion_enabled) ||
                ownerPromotionApplications.some((a) => a.card_id === card.id);

              const cm = pickPrimaryHelperCampaignForCard(helperCampaignRows, card.id);
              const hm = cm?.id ? helperCampaignMetrics[cm.id] : undefined;
              const appListForCard = cm?.id ? helperCampaignApps[cm.id] ?? [] : [];

              return (
                <li
                  key={card.id}
                  id={`dashboard-card-${card.id}`}
                  className={cn(
                    "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition",
                    "cursor-pointer hover:border-slate-300 hover:shadow-md",
                  )}
                  onClick={(e) => handleDashboardCardSurfaceClick(e, card)}
                >
                  <div className="relative">
                    <div className="aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                      <CardHeroThumbnailImg card={card} className="h-full w-full object-cover" />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/92 via-slate-900/55 to-transparent px-4 pb-4 pt-16">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="max-w-full text-lg font-bold leading-snug text-white drop-shadow">
                          {cardDisplayName(card)}
                        </h3>
                        <span className="rounded-full bg-white/95 px-2 py-0.5 text-xs font-semibold text-slate-700 shadow-sm">
                          {card.is_public ? "공개" : "비공개"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium leading-snug text-white/95">{cardSubline(card)}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/85">{cardIntroPreview(card)}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                        <span className="rounded-full bg-white/15 px-2 py-0.5 text-white backdrop-blur-sm ring-1 ring-white/25">
                          조회 {cardViewCount}
                        </span>
                        <span className="rounded-full bg-white/15 px-2 py-0.5 text-white backdrop-blur-sm ring-1 ring-white/25">
                          클릭 {cardClickCount}
                        </span>
                        <span className="rounded-full bg-white/15 px-2 py-0.5 text-white backdrop-blur-sm ring-1 ring-white/25">
                          QR
                        </span>
                        <span className="rounded-full bg-white/15 px-2 py-0.5 text-white backdrop-blur-sm ring-1 ring-white/25">
                          NFC
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 backdrop-blur-sm ring-1",
                            access.expired
                              ? "bg-red-500/35 text-white ring-red-300/40"
                              : "bg-emerald-500/25 text-emerald-50 ring-emerald-300/35",
                          )}
                        >
                          {access.expired ? "만료 · 결제 필요" : access.statusLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div data-dashboard-card-stop className="space-y-4 border-t border-slate-100 p-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                      <p className="text-xs font-bold text-slate-700">내 명함 링크</p>
                      <p className="mt-1 text-[11px] font-medium leading-snug text-slate-500">
                        고객 연결용 · 상담·문의가 이 주소로 이어집니다.
                      </p>
                      {cardPublicHref ? (
                        <a
                          href={cardPublicHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 block break-all text-xs font-semibold text-brand-800 underline underline-offset-2 hover:text-brand-950"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {cardPublicHref}
                        </a>
                      ) : (
                        <p className="mt-1 text-xs font-semibold text-slate-500">/c/ 주소 미설정</p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-900 px-3 text-sm font-bold text-white hover:bg-slate-800 disabled:pointer-events-none disabled:opacity-50"
                          disabled={!cardPublicHref}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (cardPublicHref) window.open(cardPublicHref, "_blank", "noopener,noreferrer");
                          }}
                        >
                          내 명함 확인하기
                        </button>
                        <button
                          type="button"
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900 hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
                          disabled={!cardPublicHref}
                          onClick={(e) => {
                            e.stopPropagation();
                            void copyCardLink(card);
                          }}
                        >
                          링크 복사하기
                        </button>
                      </div>
                      {cardCopyId === card.id ? (
                        <p className="mt-3 text-xs leading-relaxed text-emerald-800">
                          <span className="font-semibold">내 명함 링크가 복사되었습니다.</span>
                          <br />
                          카카오톡, 문자, SNS에 붙여넣어 공유해 주세요.
                        </p>
                      ) : null}
                      <p className="mt-2 text-xs leading-relaxed text-slate-600">
                        NFC 태그에는 아래 「NFC 링크 복사」로 만든 주소를 저장하면 됩니다.
                      </p>
                    </div>

                    <CardQrAndExportPanel card={card} />

                    {access.expired ? (
                      <div className="rounded-2xl border border-cta-200 bg-cta-50 px-4 py-4">
                        <p className="text-sm font-bold text-slate-900">
                          이 명함의 한 달 이용 기간이 끝났어요.
                        </p>
                        <p className="mt-1 text-sm text-slate-600">계속 이용하려면 결제가 필요합니다.</p>
                        <button
                          type="button"
                          className="mt-3 inline-flex min-h-10 items-center justify-center rounded-xl bg-cta-500 px-4 text-sm font-bold text-white hover:bg-cta-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            void payForCardExtension(card);
                          }}
                        >
                          14,900원 결제하고 한 달 연장
                        </button>
                      </div>
                    ) : null}

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                      {cardPublicHref ? (
                        <a
                          href={cardPublicHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-900 px-3 text-sm font-bold text-white hover:bg-slate-800"
                          onClick={(e) => e.stopPropagation()}
                        >
                          보기
                        </a>
                      ) : (
                        <span className="inline-flex min-h-10 cursor-not-allowed items-center justify-center rounded-xl bg-slate-200 px-3 text-sm font-bold text-slate-500">
                          보기
                        </span>
                      )}
                      {canEditCard ? (
                        <Link
                          to={`/cards/${encodeURIComponent(card.id)}/edit`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900 hover:bg-slate-50"
                        >
                          바로 수정
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900 hover:bg-slate-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          void openQr(card);
                        }}
                      >
                        QR 보기
                      </button>
                      <button
                        type="button"
                        className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-900 px-3 text-xs font-bold text-white hover:bg-slate-800 sm:text-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          void copyNfcLink(card);
                        }}
                      >
                        {nfcCopyCardId === card.id ? "복사됨" : "NFC 링크 복사"}
                      </button>
                      <button
                        type="button"
                        className="inline-flex min-h-10 items-center justify-center rounded-xl bg-cta-500 px-3 text-sm font-bold text-white hover:bg-cta-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          openHelperCampaignPrimaryAction(card, cm);
                        }}
                      >
                        {cm?.status === "draft"
                          ? "요청서 작성하기"
                          : cm && cm.status !== "canceled"
                            ? cm.status === "recruiting"
                              ? "지원자 확인하기"
                              : cm.status === "active"
                                ? "성과 보기"
                                : cm.status === "completed"
                                  ? "결과 보기"
                                  : HELPER_LINK_PAYMENT_CTA
                            : card.promotion_enabled && !cm
                              ? "고객 유입 링크 관리"
                              : HELPER_LINK_PAYMENT_CTA}
                      </button>                    </div>
                  {cardShareHintId === card.id ? (
                    <p className="mt-2 text-sm font-medium text-brand-800">
                      카카오톡 공유가 어려워 내 명함 링크를 복사했어요. 대화방에 붙여넣어 주세요.
                    </p>
                  ) : null}
                  <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-4">
                    <p className="text-sm font-bold text-slate-900">내 고객 유입 링크</p>
                    <p className="mt-1 text-xs font-medium text-slate-600">
                      고객 유입 확장용입니다. 이 링크를 보내면 고객이 내 명함을 보고 연락합니다. 홍보 파트너와 함께 쓸 수
                      있는 주소예요.
                    </p>
                    {cm ? (
                      <p className="mt-2 rounded-lg bg-white/70 px-2 py-1.5 text-[11px] font-bold text-slate-800 ring-1 ring-brand-100 sm:text-xs">
                        {cm.status === "draft"
                          ? "고객 유입 링크 결제 완료 · 홍보 요청서 작성이 필요합니다."
                          : cm.status === "recruiting"
                            ? "홍보 파트너 모집 중입니다."
                            : cm.status === "active"
                              ? "고객 유입 링크 홍보가 진행 중입니다."
                              : cm.status === "completed"
                                ? "고객 유입 링크 홍보가 종료되었습니다."
                                : null}
                      </p>
                    ) : card.promotion_enabled ? (
                      <p className="mt-2 rounded-lg bg-white/70 px-2 py-1.5 text-[11px] font-bold text-slate-800 ring-1 ring-brand-100 sm:text-xs">
                        홍보 파트너 모집 중
                      </p>
                    ) : null}
                    {cm && hm ? (
                      <dl className="mt-4 grid gap-2 rounded-xl border border-brand-100 bg-white/90 px-3 py-3 text-[11px] sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <dt className="font-semibold text-slate-500">지원자 수</dt>
                          <dd className="mt-0.5 tabular-nums font-bold text-slate-900">{appListForCard.length}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-slate-500">선택된 파트너</dt>
                          <dd className="mt-0.5 tabular-nums font-bold text-slate-900">{hm.selectedPartnerIds.length}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-slate-500">캠페인 방문</dt>
                          <dd className="mt-0.5 tabular-nums font-bold text-slate-900">{hm.totalViews}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-slate-500">문의 클릭</dt>
                          <dd className="mt-0.5 tabular-nums font-bold text-slate-900">{hm.inquiryClicks}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-slate-500">상담·폼 접수</dt>
                          <dd className="mt-0.5 tabular-nums font-bold text-slate-900">{hm.consultationRows + hm.formSubmits}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-slate-500">진행 기간</dt>
                          <dd className="mt-0.5 font-semibold text-slate-800">
                            {(cm.start_date ?? "—") + " ~ " + (cm.end_date ?? "—")}
                          </dd>
                        </div>
                        <div className="sm:col-span-2 lg:col-span-3">
                          <dt className="font-semibold text-slate-500">마지막 유입</dt>
                          <dd className="mt-0.5 font-semibold text-slate-800">
                            {hm.lastEventAt ? new Date(hm.lastEventAt).toLocaleString("ko-KR") : "—"}
                          </dd>
                        </div>
                        {Object.entries(hm.byPartnerId).length > 0 ? (
                          <div className="sm:col-span-2 lg:col-span-3">
                            <dt className="font-semibold text-slate-500">파트너별 방문 요약</dt>
                            <dd className="mt-1 flex flex-wrap gap-2">
                              {Object.entries(hm.byPartnerId)
                                .sort(([, a], [, b]) => b.views - a.views)
                                .slice(0, 4)
                                .map(([pid, pv]) => (
                                  <span
                                    key={pid}
                                    className="rounded-lg bg-brand-50 px-2 py-1 text-[11px] font-semibold text-brand-950 ring-1 ring-brand-100"
                                  >
                                    {pv.name}: 방문 {pv.views}, 문의 {pv.inquiryClicks}
                                  </span>
                                ))}
                            </dd>
                          </div>
                        ) : null}
                      </dl>
                    ) : cm && cm.status === "draft" ? (
                      <p className="mt-4 text-[11px] leading-relaxed text-slate-600">
                        결제 후 요청서 작성이 끝나면 지원자·성과 현황이 이곳에 표시됩니다.
                      </p>
                    ) : null}
                    <div className="mt-3 space-y-3">
                      {promotionLinks.map((link) => {
                        const linkUrl = buildPromotionLink(card, shareOrigin, link.ref_code);
                        const visitCount = cardLinkVisits.filter(
                          (visit) => visit.card_id === card.id && visit.ref_code === link.ref_code,
                        ).length;
                        return (
                          <div key={link.id} className="rounded-2xl border border-brand-100 bg-white px-3 py-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-xs font-bold text-slate-800">{link.label}</p>
                              <p className="text-xs font-semibold text-slate-500">방문 {visitCount}회</p>
                            </div>
                            <p className="mt-2 break-all text-xs font-semibold text-brand-900">{linkUrl}</p>
                            <div className="mt-3 grid gap-2 sm:grid-cols-3">
                              <button
                                type="button"
                                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-50 px-3 text-sm font-bold text-slate-900 ring-1 ring-slate-200 hover:bg-slate-100"
                                onClick={() => void copyPromotionLink(linkUrl, link.id)}
                              >
                                {promoCopyId === link.id ? "복사됨" : "고객 유입 링크 복사"}
                              </button>
                              <button
                                type="button"
                                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-50 px-3 text-sm font-bold text-slate-900 ring-1 ring-slate-200 hover:bg-slate-100"
                                onClick={() => void sharePromotionLink(card, linkUrl)}
                              >
                                카카오톡 공유
                              </button>
                              <button
                                type="button"
                                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-50 px-3 text-sm font-bold text-slate-900 ring-1 ring-slate-200 hover:bg-slate-100"
                                onClick={() => void openQr(card, linkUrl)}
                              >
                                QR 보기
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      className="mt-3 inline-flex min-h-10 items-center justify-center rounded-xl bg-cta-500 px-4 text-sm font-bold text-white shadow-sm shadow-cta-900/20 hover:bg-cta-600"
                      onClick={() => openHelperCampaignPrimaryAction(card, cm)}
                    >
                      {cm?.status === "draft"
                        ? "요청서 작성하기"
                        : cm && cm.status !== "canceled"
                          ? cm.status === "recruiting"
                            ? "지원자 확인하기"
                            : cm.status === "active"
                              ? "성과 보기"
                              : cm.status === "completed"
                                ? "결과 보기"
                                : HELPER_LINK_PAYMENT_CTA
                            : card.promotion_enabled && !cm
                              ? "고객 유입 링크 관리"
                              : HELPER_LINK_PAYMENT_CTA}
                    </button>                  </div>
                  {showPromotionPerf ? (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
                      <h3 className="text-sm font-bold text-slate-900">홍보 파트너별 성과</h3>
                      {promotionPerfRows.length === 0 ? (
                        <p className="mt-3 text-sm leading-relaxed text-slate-500">
                          아직 고객 유입 링크 홍보가 시작되지 않았습니다. 파트너를 선택하면 전용 링크가 생성되고, 방문·문의·상담
                          데이터가 이곳에 쌓입니다.
                        </p>
                      ) : (
                        <div className="mt-3 overflow-x-auto">
                          <table className="w-full min-w-[560px] text-left text-sm">
                            <thead>
                              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                                <th className="py-2 pr-2">순위</th>
                                <th className="py-2 pr-2">홍보 파트너</th>
                                <th className="py-2 pr-2">방문 수</th>
                                <th className="py-2 pr-2">최근 방문일</th>
                                <th className="py-2">고객 유입 링크</th>
                              </tr>
                            </thead>
                            <tbody>
                              {promotionPerfRows.map((row) => (
                                <tr key={row.promoter_code} className="border-b border-slate-100">
                                  <td className="py-2 pr-2 font-medium text-slate-800">{row.rank}</td>
                                  <td className="py-2 pr-2 text-slate-800">{row.label}</td>
                                  <td className="py-2 pr-2 font-semibold text-slate-900">{row.visits}</td>
                                  <td className="py-2 pr-2 text-slate-600">{formatPromotionVisitDate(row.lastVisited)}</td>
                                  <td className="py-2 align-top">
                                    <p className="break-all text-xs text-brand-800">{row.promotionLink || "—"}</p>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {uid ? (
        <section
          className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
          aria-labelledby="dashboard-performance-heading"
        >
          <h2 id="dashboard-performance-heading" className="text-lg font-bold text-slate-900 sm:text-xl">
            내 명함 성과
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            당신의 명함이 얼마나 고객을 만들고 있는지 확인하세요.
          </p>
          {hasPerformanceSignal ? (
            <p className="mt-3 max-w-2xl rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm font-medium text-emerald-950">
              좋아요. 명함이 고객에게 도달하고 있습니다.
            </p>
          ) : (
            <p className="mt-3 max-w-2xl rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm font-medium text-amber-950">
              아직 고객 반응이 없어요. 고객 유입 링크 안내 문구를 복사해 카카오톡, 당근, 문자에 공유해 보세요.
            </p>
          )}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <PerformanceStatCard label="조회수" hint="공개 명함 열람·조회 기록" value={viewsDisplay} />
            <PerformanceStatCard label="클릭수" hint="명함 속 버튼·링크 클릭" value={clicksDisplay} />
            <PerformanceStatCard label="문의 수" hint="문의·상담 성격 연결" value={inquiriesDisplay} />
            <PerformanceStatCard label="유입 수" hint="고객 유입 링크로 명함 페이지에 들어온 횟수" value={promoLinkInboundCount} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            <PerformanceStatCard label="추천 링크 가입자 수" hint="내 추천 링크 경로로 가입한 사용자" value={referredCount} />
            <PerformanceStatCard
              label="결제 전환 수"
              hint="추천 보상이 적립된 결제 건수"
              value={referralPaymentConversionCount}
            />
            <PerformanceStatCard
              label="적립 예정 보상"
              hint="정산 전 추천 보상(원)"
              value={Math.round(referralRewardBalances.pending)}
            />
          </div>
        </section>
      ) : null}

      {uid && myCards.length > 0 && isSupabaseConfigured ? (
        <section
          className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          aria-labelledby="dashboard-reservations-heading"
        >
          <h2 id="dashboard-reservations-heading" className="text-lg font-bold text-slate-900 sm:text-xl">
            예약 현황
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
            고객이 공개 명함에서 신청한 예약입니다.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">오늘 예약</p>
              <p className="mt-1 text-2xl font-extrabold text-emerald-950">{reservationsToday.length}</p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-900">대기 예약</p>
              <p className="mt-1 text-2xl font-extrabold text-amber-950">{reservationsWaiting.length}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/90 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-600">이용 완료</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">{reservationsDone.length}</p>
            </div>
          </div>
          {ownerReservations.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">아직 등록된 예약이 없습니다.</p>
          ) : (
            <ul className="mt-6 divide-y divide-slate-100 rounded-xl border border-slate-100">
              {ownerReservations.slice(0, 24).map((r) => {
                const cardLabel =
                  myCards.find((c) => c.id === r.card_id)?.person_name?.trim() ||
                  myCards.find((c) => c.id === r.card_id)?.brand_name?.trim() ||
                  "명함";
                return (
                  <li key={r.id} className="flex flex-col gap-1 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {r.reservation_date} · {r.time_slot}
                      </p>
                      <p className="text-slate-600">
                        {cardLabel} · {r.customer_name} · {r.service_name}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold uppercase text-slate-700">
                      {r.status}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}

      {uid && myCards.length > 0 ? (
        <section
          id="dashboard-share-loop"
          className="mt-6 rounded-2xl border-2 border-cta-400/55 bg-gradient-to-br from-cta-50 via-white to-emerald-50/85 p-5 shadow-lg shadow-cta-900/10 sm:p-6"
          aria-labelledby="dashboard-share-loop-heading"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="min-w-0">
              <p id="dashboard-share-loop-heading" className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">
                지금 공유하면 더 많은 고객이 들어옵니다
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600 sm:text-base">
                성과를 잠깐 확인했다면, 같은 명함 링크를 카카오·당근·문자로 한 번 더 보내 보세요.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex min-h-[52px] shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cta-500 to-cta-600 px-5 text-base font-extrabold text-white shadow-md shadow-cta-900/20 hover:from-cta-400 hover:to-cta-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta-400 focus-visible:ring-offset-2"
              onClick={scrollToMyCardsSection}
            >
              <Share2 className="h-5 w-5 shrink-0" aria-hidden />
              내 명함에서 공유하기
            </button>
          </div>
        </section>
      ) : null}

      {uid && myCards.length > 0 ? (
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">고객 유입·홍보 파트너 현황</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
            홍보 파트너가 고객 유입 링크로 연결한 방문이 집계됩니다. 누가 더 많은 고객을 연결하는지 한눈에 확인할 수 있어요.
          </p>
          {visitOwnerStats.totalVisits === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
              <p className="text-base font-medium text-slate-700">아직 고객 유입 링크 홍보가 시작되지 않았습니다.</p>
              <p className="mt-2 text-sm text-slate-500">
                파트너를 선택하면 전용 링크가 생성되고, 방문·문의·상담 데이터가 이곳에 쌓입니다.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <StatBlock label="총 방문 수" value={String(visitOwnerStats.totalVisits)} />
              <StatBlock label="고객 유입 링크 방문" value={String(visitOwnerStats.promotionVisits)} />
              <StatBlock label="직접 방문" value={String(visitOwnerStats.directVisits)} />
              <StatBlock label="참여 홍보 파트너 수" value={String(visitOwnerStats.promoterCount)} />
              <StatBlock label="최고 성과 홍보 파트너" value={topPromoterDisplay} />
            </div>
          )}
        </section>
      ) : null}

      {uid ? (
        <section
          id="dashboard-section-helper-mgmt"
          className="mt-10 rounded-2xl border border-brand-200/80 bg-gradient-to-br from-brand-50 via-white to-sky-50 p-4 shadow-sm sm:p-6"
          aria-labelledby="dashboard-section-helper-mgmt-heading"
        >
          <div>
            <h2 id="dashboard-section-helper-mgmt-heading" className="text-lg font-semibold text-slate-900 sm:text-xl">
              내 홍보 파트너 관리
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
              홍보 파트너 모집, 지원자 확인, 홍보 성과를 한곳에서 관리합니다.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/helperlink/pay"
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-brand-700 px-5 text-base font-bold text-white shadow hover:bg-brand-800"
              >
                고객 유입 링크 만들기
              </Link>              <Link
                to="/helper-partner/register"
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-white px-5 text-base font-semibold text-slate-900 ring-1 ring-slate-300 hover:bg-slate-50"
              >
                홍보 파트너 신청
              </Link>
              <Link
                to="/helper-partner/campaigns"
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-white px-5 text-base font-semibold text-slate-900 ring-1 ring-slate-300 hover:bg-slate-50"
              >
                진행 중 캠페인 보기(파트너)
              </Link>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              결제 플로우는 데모입니다. <span className="font-semibold text-slate-700">{HELPER_LINK_PAYMENT_LEAD}</span>
            </p>
          </div>

          {helperCampaignPerfBusy ? (
            <p className="mt-4 text-sm text-slate-600">홍보 파트너 캠페인 목록을 불러오는 중입니다…</p>
          ) : null}

          {helperCampaignRows.length > 0 ? (
            <div className="mt-6 rounded-2xl border border-brand-100 bg-white/90 p-4">
              <h3 className="text-base font-bold text-slate-900">내가 연 홍보 파트너 캠페인</h3>
              <ul className="mt-4 grid gap-4 md:grid-cols-2">
                {helperCampaignRows.map((c) => {
                  const apps = helperCampaignApps[c.id] ?? [];
                  const card = businessCards.find((bc) => bc.id === c.card_id);
                  const met = helperCampaignMetrics[c.id];
                  return (
                    <li key={c.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <p className="text-xs font-semibold uppercase text-slate-500">캠페인</p>
                      <p className="mt-1 text-sm font-bold text-slate-900">{c.title || "제목 없음"}</p>
                      <p className="mt-2 text-xs text-slate-600">
                        상태: <span className="font-semibold">{c.status}</span> · 홍보 명함:{" "}
                        {card ? cardDisplayName(card) : c.card_id}
                      </p>
                      <dl className="mt-3 grid gap-2 text-[11px] text-slate-700 sm:grid-cols-2">
                        <div>
                          <dt className="font-semibold text-slate-500">지원자 수</dt>
                          <dd className="tabular-nums font-bold">{apps.length}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-slate-500">선택 파트너</dt>
                          <dd className="tabular-nums font-bold">{met?.selectedPartnerIds.length ?? 0}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-slate-500">방문</dt>
                          <dd className="tabular-nums font-bold">{met?.totalViews ?? 0}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-slate-500">문의 클릭 · 상담</dt>
                          <dd className="tabular-nums font-bold">
                            {(met?.inquiryClicks ?? 0) + (met?.consultationRows ?? 0) + (met?.formSubmits ?? 0)} (클릭{" "}
                            {met?.inquiryClicks ?? 0})
                          </dd>
                        </div>
                      </dl>
                      <p className="mt-2 text-xs text-slate-500">
                        기간 {(c.start_date ?? "—") + " ~ " + (c.end_date ?? "—")}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {c.status === "draft" ? (
                          <Link
                            to={`/helperlink/create?campaignId=${encodeURIComponent(c.id)}`}
                            className="inline-flex rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-black"
                          >
                            요청서 작성하기
                          </Link>
                        ) : null}
                        {c.status === "recruiting" ? (
                          <Link
                            to={`/dashboard/helper-campaigns/${encodeURIComponent(c.id)}/applications`}
                            className="inline-flex rounded-lg bg-brand-700 px-3 py-2 text-xs font-bold text-white hover:bg-brand-800"
                          >
                            지원자 확인하기
                          </Link>
                        ) : null}
                        {c.status === "active" ? (
                          <Link
                            to={`/dashboard/helper-campaigns/${encodeURIComponent(c.id)}/stats`}
                            className="inline-flex rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800"
                          >
                            성과 보기
                          </Link>
                        ) : null}
                        {c.status === "completed" ? (
                          <Link
                            to={`/dashboard/helper-campaigns/${encodeURIComponent(c.id)}/stats`}
                            className="inline-flex rounded-lg bg-slate-700 px-3 py-2 text-xs font-bold text-white hover:bg-slate-900"
                          >
                            결과 보기
                          </Link>
                        ) : null}
                      </div>
                      {apps.length === 0 && c.status === "recruiting" ? (
                        <p className="mt-3 text-xs text-slate-500">아직 파트너 지원이 없습니다.</p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          {approvedPromotions.length > 0 ? (
            <>
              <h3 className="mt-8 text-base font-bold text-slate-800">내가 받은 홍보 파트너 고객 유입 링크 (기존)</h3>
              <ul className="mt-4 grid gap-4 lg:grid-cols-2">
                {approvedPromotions.map((application) => {
                  const card = businessCards.find((bc) => bc.id === application.card_id);
                  const slug = card?.slug?.trim() ?? application.card_slug ?? "";
                  const code = application.promoter_code ?? "";
                  const promotionUrl =
                    slug && code ? buildPromotionUrl(promoteOrigin, slug, code) : application.promotion_url ?? "";
                  const logsForPromo = promoterVisitLogs.filter(
                    (l) => l.card_id === application.card_id && l.promoter_code === application.promoter_code,
                  );
                  const visitCount = logsForPromo.length;
                  const lastVisited =
                    logsForPromo.length === 0
                      ? null
                      : [...logsForPromo].sort(
                          (a, b) => new Date(b.visited_at).getTime() - new Date(a.visited_at).getTime(),
                        )[0]?.visited_at ?? null;
                  return (
                    <li key={application.id} className="rounded-2xl border border-brand-100 bg-white px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">내가 홍보 중인 명함</p>
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        {card ? cardDisplayName(card) : application.card_name ?? "홍보 중인 명함"}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold text-slate-700">
                        <span>방문 {visitCount}회</span>
                        <span className="text-slate-500">최근 방문 {formatPromotionVisitDate(lastVisited)}</span>
                      </div>
                      <p className="mt-3 text-xs font-bold text-slate-600">내 고객 유입 링크</p>
                      <p className="mt-1 break-all rounded-xl bg-brand-50 px-3 py-3 text-xs font-semibold text-brand-900">
                        {promotionUrl}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-slate-50 px-3 text-sm font-bold text-slate-900 ring-1 ring-slate-200 hover:bg-slate-100 sm:min-w-[120px] sm:flex-none"
                          onClick={() => void copyPromotionLink(promotionUrl, application.id)}
                        >
                          {promoCopyId === application.id ? "복사됨" : "링크 복사"}
                        </button>
                        {card ? (
                          <button
                            type="button"
                            className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-slate-50 px-3 text-sm font-bold text-slate-900 ring-1 ring-slate-200 hover:bg-slate-100 sm:min-w-[120px] sm:flex-none"
                            onClick={() => void sharePromotionLink(card, promotionUrl)}
                          >
                            카카오톡 공유
                          </button>
                        ) : null}
                        {card ? (
                          <button
                            type="button"
                            className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-slate-50 px-3 text-sm font-bold text-slate-900 ring-1 ring-slate-200 hover:bg-slate-100 sm:min-w-[120px] sm:flex-none"
                            onClick={() => void openQr(card, promotionUrl)}
                          >
                            QR 보기
                          </button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}

          {helperCampaignRows.length === 0 && approvedPromotions.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-brand-200 bg-white/70 px-4 py-6 text-center">
              <p className="text-sm font-semibold text-slate-900">아직 진행 중인 홍보 파트너 홍보가 없습니다.</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                고객 유입 링크 만들기부터 시작해 보거나, 홍보 파트너 신청 후 지원까지 이어 줄 수 있습니다.
              </p>
              <Link
                to="/helperlink/pay"
                className="mt-4 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-brand-700 px-6 text-base font-bold text-white shadow hover:bg-brand-800"
              >
                고객 유입 링크 만들기
              </Link>
              <p className="mx-auto mt-3 max-w-md text-xs leading-relaxed text-slate-500">
                혼자 홍보가 어렵다면 홍보 파트너와 함께 홍보를 시작해 보세요. 고객 유입 링크는 유료 결제 후 생성되며, 파트너가 대신 홍보할 수 있는 전용 링크입니다.
              </p>
            </div>
          ) : null}
        </section>
      ) : null}

      {!isCreator ? (
        <section className="mt-10 rounded-2xl border border-brand-200/80 bg-gradient-to-br from-brand-50 via-white to-sky-50 p-4 shadow-sm sm:p-6">
          <div className="rounded-xl border border-brand-100 bg-white/70 px-4 py-4">
            <p className="text-sm font-bold text-brand-900">추천인 보상</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">지인에게 보낸 링크로 성과가 쌓입니다</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              이 링크를 지인에게 보내면 린코를 소개할 수 있습니다. 이 링크로 가입하고 결제하면 추천 성과로 기록됩니다.
              적립된 보상은 출금 신청을 통해 받을 수 있습니다.
            </p>
            <p className="mt-3 text-sm font-medium text-slate-800">보상 예시</p>
            <ul className="mt-1 list-inside list-disc text-sm text-slate-600">
              <li>14,900원 결제 시 1,490원 적립</li>
              <li>59,000원 결제 시 5,900원 적립</li>
            </ul>
          </div>

          <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <h3 className="text-lg font-semibold text-slate-900 sm:text-xl">내가 추천할 링크</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                이 링크를 지인에게 보내면 린코를 소개할 수 있습니다. 가입과 결제가 발생하면 내 추천 성과로 기록됩니다.
              </p>
              <p className="mt-3 text-xs leading-relaxed text-slate-500">
                명함 주소(<span className="font-mono">/c/···</span>)와 추천용 주소(<span className="font-mono">/?ref=···</span>)는
                목적이 다릅니다. 고객에게 보여 줄 때는 명함 링크, 플랫폼 소개에는 추천 링크를 사용하세요.
              </p>
              <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
                같은 브라우저에서는 추천 링크 미리보기가 비로그인 상단바 기준일 수 있습니다. 아래 「새 탭에서 미리보기」로
                테스트해 보실 수 있습니다.
              </p>
            </div>
            <div className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200">
              추천으로 연결된 가입 {referredCount}명 / 5명
            </div>
          </div>

          <div className="mt-5 space-y-6">
            <div className="rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50 to-white px-4 py-4 shadow-sm shadow-amber-900/5">
              <p className="text-sm font-bold text-amber-950">공유 순서 안내</p>
              <p className="mt-2 text-sm leading-relaxed text-amber-950/85">
                링크만 보내면 미리보기 이미지가 보이지 않을 수 있습니다. 그럴 때는 홍보 이미지를 먼저 보내고,
                아래 추천 링크를 함께 보내 주세요.
              </p>
              <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-amber-950/90">
                <li>
                  <span className="font-semibold">카카오톡:</span> 이미지 → 추천 링크 순서로 보내면 이해가 빠릅니다.
                </li>
                <li>
                  <span className="font-semibold">당근:</span> 게시글에는 이미지를 첨부하고, 본문에 추천 링크를 넣어 주세요.
                </li>
                <li>
                  <span className="font-semibold">블로그/유튜브:</span> 이미지와 함께 추천 링크를 본문이나 설명란에 넣어 주세요.
                </li>
              </ul>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800">내가 추천할 링크 주소</p>
              {referralLink ? (
                <a
                  href={referralLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block break-all rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm font-semibold text-brand-900 underline underline-offset-2 hover:text-brand-950"
                  onClick={(e) => e.stopPropagation()}
                >
                  {referralLink}
                </a>
              ) : (
                <p className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm font-semibold text-slate-500">
                  링크를 불러오는 중입니다.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <h4 className="text-base font-bold text-slate-900">함께 보낼 추천 이미지</h4>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                링크 미리보기가 보이지 않을 때 이 이미지를 먼저 보내고,
                그다음 추천 링크를 보내면 더 쉽게 이해됩니다.
              </p>
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-inner">
                <img
                  src={REFERRAL_PROMO_IMAGE_URL}
                  alt="Linko 디지털 명함 추천용 홍보 이미지"
                  className="mx-auto block max-h-[min(520px,70vh)] w-full max-w-xl object-contain"
                  loading="lazy"
                  decoding="async"
                />
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-cta-500 px-4 text-sm font-bold text-white shadow-sm shadow-cta-900/20 hover:bg-cta-600 disabled:pointer-events-none disabled:opacity-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    void copyReferralLink();
                  }}
                  disabled={!referralLink}
                >
                  추천 링크 복사하기
                </button>
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-300 bg-brand-50 px-4 text-sm font-bold text-brand-900 hover:bg-brand-100 disabled:pointer-events-none disabled:opacity-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    void copyReferralMessage();
                  }}
                  disabled={!referralLink}
                >
                  추천 문구 복사하기
                </button>
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-900 hover:bg-slate-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    void saveReferralPromoImage();
                  }}
                >
                  홍보 이미지 저장하기
                </button>
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-bold text-white shadow-sm hover:bg-slate-800"
                  onClick={(e) => {
                    e.stopPropagation();
                    void pasteReferralPromoImage();
                  }}
                >
                  홍보 이미지 복사하기
                </button>
              </div>

              <button
                type="button"
                className="mt-4 text-xs font-semibold text-brand-800 underline underline-offset-2 hover:text-brand-950 disabled:text-slate-400 disabled:no-underline"
                disabled={!refCode}
                onClick={(e) => {
                  e.stopPropagation();
                  const href = refCode ? buildSignupReferralGuestPreviewUrl(refCode, canonicalSiteOrigin()) : "";
                  if (href) window.open(href, "_blank", "noopener,noreferrer");
                }}
              >
                새 탭에서 추천 링크 미리보기 열기
              </button>

              <div className="mt-5 space-y-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
                <p>
                  <span className="font-bold text-slate-900">카카오톡</span>: 카카오톡에서 이미지가 보이지 않으면 홍보
                  이미지를 먼저 보내고, 추천 링크를 이어서 보내 주세요.
                </p>
                <p>
                  <span className="font-bold text-slate-900">당근</span>: 당근에서는 이미지가 먼저 보이는 것이 중요합니다.
                  홍보 이미지를 저장해 게시글에 올리고, 본문에 추천 링크를 붙여 넣어 주세요.
                </p>
              </div>

              <p className="mt-4 rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs leading-relaxed text-slate-600">
                <span className="font-semibold text-slate-800">안내:</span> 이미지가 안 보이는 앱에서는 홍보 이미지를 먼저
                보내고 추천 링크를 이어서 보내 주세요.
              </p>

              {referralLinkCopiedFlash ? (
                <p className="mt-3 text-xs leading-relaxed text-emerald-800" role="status">
                  추천 링크가 복사되었습니다.
                </p>
              ) : null}
              {referralMessageCopiedFlash ? (
                <p className="mt-2 text-xs leading-relaxed text-emerald-800" role="status">
                  추천 문구가 복사되었습니다. 카카오톡 등에 바로 붙여 넣을 수 있어요.
                </p>
              ) : null}
              {referralPromoCopiedFlash ? (
                <p className="mt-2 text-xs leading-relaxed text-emerald-800" role="status">
                  홍보 이미지가 클립보드에 복사되었습니다. 채팅창에서 붙여 넣어 보세요.
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-8 rounded-xl border border-slate-200 bg-white px-4 py-5 shadow-sm">
            <p className="text-sm font-bold text-slate-900">추천한 링크 성과</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              내가 보낸 링크로 얼마나 많은 사람이 들어오고 가입했는지 확인할 수 있습니다.
            </p>
            <dl className="mt-4 grid gap-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">방문 수</dt>
                <dd className="mt-1 text-xl font-bold tabular-nums text-slate-900">
                  {(referralClickCountDb ?? 0).toLocaleString()}
                </dd>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">추천 링크(메인)가 열린 횟수입니다.</p>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">가입 수</dt>
                <dd className="mt-1 text-xl font-bold tabular-nums text-slate-900">{referredCount}명</dd>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  추천 관계로 가입 완료한 사람입니다.
                </p>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">결제 수</dt>
                <dd className="mt-1 text-xl font-bold tabular-nums text-slate-900">
                  {referralPaymentConversionCount}건
                </dd>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  추천으로 연결된 가입자가 유료 결제한 횟수입니다.
                </p>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">적립 예정 보상</dt>
                <dd className="mt-1 text-xl font-bold tabular-nums text-brand-900">
                  {referralRewardBalances.pending.toLocaleString()}원
                </dd>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  추천 보상: 결제 금액의 10%가 적립됩니다. 결제 후 7일이 지나 출금 신청 가능 상태로 바뀝니다.
                </p>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">출금 가능 보상</dt>
                <dd className="mt-1 text-xl font-bold tabular-nums text-emerald-800">
                  {referralRewardBalances.confirmedAvailable.toLocaleString()}원
                </dd>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  확정된 보상 중 출금 신청할 수 있는 금액입니다.
                </p>
              </div>
            </dl>
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-white/80 px-4 py-4">
            <p className="text-sm font-bold text-slate-900">가입 인원 혜택 안내</p>
            <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-slate-700">
              <li>5명이 가입하면 14,900원 이용권 1개월 무료</li>
              <li>10명이 가입하면 14,900원 이용권 2개월 무료</li>
            </ul>
            <p className="mt-3 text-sm font-semibold text-brand-900">
              현재 적용 가능 혜택: 14,900원 이용권 {rewardMonths}개월 무료
            </p>
          </div>

          <div className="mt-8 rounded-xl border border-brand-200 bg-white px-4 py-5 shadow-sm">
            <p className="text-sm font-bold text-brand-900">추천 보상</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              내가 추천할 링크로 가입한 사용자가 결제하면 결제 금액의 10%가 보상으로 적립됩니다. 추천 보상은 실제 결제 완료 건에 대해서만 적립되며, 환불 시 보상은 취소되거나 조정될 수 있습니다. 출금은 관리자 확인 후 지급됩니다.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              정상적인 추천 활동만 보상이 지급됩니다. 부정 가입 또는 반복 생성 계정은 보상이 취소될 수 있습니다.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatBlock label="총 적립 보상" value={`${referralRewardBalances.totalAccrued.toLocaleString()}원`} />
              <StatBlock label="정산 가능 보상" value={`${referralRewardBalances.confirmedAvailable.toLocaleString()}원`} />
              <StatBlock label="정산 대기 보상" value={`${referralRewardBalances.pending.toLocaleString()}원`} />
              <StatBlock label="지급 완료 보상" value={`${referralRewardBalances.paid.toLocaleString()}원`} />
            </div>
            {referralRewardBalances.confirmedLocked > 0 ? (
              <p className="mt-3 text-xs text-slate-600">
                출금 신청 처리 중(관리자 확인 단계)인 금액 {referralRewardBalances.confirmedLocked.toLocaleString()}원은
                &quot;정산 가능 보상&quot; 집계에서 빠져 있습니다.
              </p>
            ) : null}
            {referralRewardBalances.pendingClawback > 0 ? (
              <p className="mt-2 text-xs font-medium text-amber-800">
                환불 차감 예정 합계 약 {referralRewardBalances.pendingClawback.toLocaleString()}원이 다음 정산에서 반영될 수 있습니다.
              </p>
            ) : null}
            <button
              type="button"
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-bold text-white hover:bg-slate-800 sm:w-auto"
              onClick={() => openWithdrawalModal()}
              disabled={
                confirmedSelectableRewards.reduce((s, r) => s + r.reward_amount, 0) < MIN_WITHDRAWAL_KRW
              }
            >
              출금 신청하기
            </button>
            {confirmedSelectableRewards.reduce((s, r) => s + r.reward_amount, 0) < MIN_WITHDRAWAL_KRW ? (
              <p className="mt-2 text-xs text-slate-500">
                정산 가능 보상이 {MIN_WITHDRAWAL_KRW.toLocaleString()}원 이상일 때 출금 신청할 수 있습니다. 관리자 확인 후 정산 가능 상태로 바뀐 보상만 포함됩니다.
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {uid ? <RewardAdsSection placement="dashboard" className="mt-10" /> : null}

      {!isCreator ? (
        <section className="mt-10 rounded-2xl border border-brand-200/80 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">진행 중 의뢰</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                제작 전문가에게 맡긴 디자인 의뢰와 시안 상태를 확인합니다.
              </p>
            </div>
            <Link
              to="/request"
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-cta-500 px-4 text-sm font-bold text-white shadow-sm shadow-cta-900/20 hover:bg-cta-600"
            >
              디자인 제작 의뢰하기
            </Link>
          </div>

          {myDesignRequests.length > 0 ? (
            <ul className="mt-6 grid gap-4 lg:grid-cols-2">
              {myDesignRequests.map((request) => (
                <li key={request.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">명함 디자인 제작 의뢰</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {request.business_type} · {DESIGN_REQUEST_STYLE_LABEL[request.style]}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                      <span className="rounded-full bg-white px-2.5 py-1 text-slate-700 ring-1 ring-slate-200">
                        {DESIGN_REQUEST_PAYMENT_STATUS_LABEL[request.payment_status]}
                      </span>
                      <span className="rounded-full bg-brand-50 px-2.5 py-1 text-brand-800 ring-1 ring-brand-100">
                        {DESIGN_REQUEST_STATUS_LABEL[request.status]}
                      </span>
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-700">{request.request_message}</p>
                  {request.draft_image_url ? (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
                      <p className="text-sm font-bold text-slate-900">시안 보기</p>
                      <img
                        src={request.draft_image_url}
                        alt="명함 디자인 시안"
                        className="mt-3 max-h-64 w-full rounded-xl object-contain bg-slate-100"
                        loading="lazy"
                      />
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900 hover:bg-slate-50"
                          onClick={() => void changeDesignRequestStatus(request.id, "revision_requested")}
                        >
                          수정 요청
                        </button>
                        <button
                          type="button"
                          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-900 px-3 text-sm font-bold text-white hover:bg-slate-800"
                          onClick={() => void changeDesignRequestStatus(request.id, "completed")}
                        >
                          이 시안으로 확정
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 rounded-xl bg-white px-3 py-3 text-sm font-medium text-slate-600 ring-1 ring-slate-200">
                      시안이 도착하면 이곳에서 확인할 수 있습니다.
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
              <p className="text-base font-bold text-slate-900">진행 중인 디자인 의뢰가 없습니다.</p>
              <p className="mt-2 text-sm text-slate-500">필요하면 제작 전문가에게 명함 디자인 제작을 맡길 수 있어요.</p>
            </div>
          )}
        </section>
      ) : null}

      {uid ? (
        <section
          id="dashboard-section-expert-direct-requests"
          className="mt-10 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">제작 전문가 직접 의뢰</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                전문가에게 보낸 의뢰와, 내 프로필로 들어온 의뢰를 한곳에서 확인합니다. 데모 환경에서는 브라우저에 저장됩니다.
              </p>
            </div>
            <Link
              to="/creators"
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-900 hover:bg-slate-50"
            >
              전문가 둘러보기
            </Link>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">보낸 의뢰</h3>
              {mySentExpertRequests.length > 0 ? (
                <ul className="mt-3 grid gap-3">
                  {mySentExpertRequests.map((r) => {
                    const ex = expertLookup.get(r.expert_id);
                    const headline = r.title?.trim() || r.work_category || "직접 의뢰";
                    return (
                      <li key={r.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-sm font-bold text-slate-900">{headline}</p>
                        <p className="mt-1 text-xs text-slate-600">
                          받는 분:{" "}
                          <span className="font-semibold text-slate-800">
                            {ex?.display_name?.trim() || ex?.id || r.expert_id}
                          </span>
                          {" · "}
                          {EXPERT_REQUEST_PURPOSE_LABEL[r.request_purpose]}
                          {r.work_category ? ` · ${r.work_category}` : null}
                        </p>
                        <p className="mt-2 line-clamp-2 text-sm text-slate-700">{r.description}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-slate-700 ring-1 ring-slate-200">
                            {DIRECT_REQUEST_STATUS_LABEL[r.status]}
                          </span>
                          <span className="text-slate-500">
                            {new Date(r.created_at).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })}
                          </span>
                        </div>
                        {ex ? (
                          <Link
                            to={`/creators/${encodeURIComponent(ex.id)}`}
                            className="mt-2 inline-block text-xs font-bold text-brand-800 hover:underline"
                          >
                            전문가 프로필
                          </Link>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-600">
                  아직 보낸 직접 의뢰가 없습니다.
                </p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900">받은 의뢰</h3>
              {myExpertProfileIds.size === 0 ? (
                <p className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-sm text-slate-600">
                  전문가로 등록된 프로필이 연결되면 이곳에 들어오는 의뢰가 표시됩니다.
                </p>
              ) : myReceivedExpertRequests.length > 0 ? (
                <ul className="mt-3 grid gap-3">
                  {myReceivedExpertRequests.map((r) => {
                    const ex = expertLookup.get(r.expert_id);
                    const requester =
                      platformUsers.find((u) => u.id === r.requester_id) ?? null;
                    const requesterLabel =
                      r.requester_name?.trim() ||
                      requester?.name?.trim() ||
                      requester?.email?.split("@")[0] ||
                      "의뢰자";
                    const headline = r.title?.trim() || r.work_category || "직접 의뢰";
                    return (
                      <li key={r.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-sm font-bold text-slate-900">{headline}</p>
                        <p className="mt-1 text-xs text-slate-600">
                          보낸 분: <span className="font-semibold text-slate-800">{requesterLabel}</span>
                          {" · "}
                          {EXPERT_REQUEST_PURPOSE_LABEL[r.request_purpose]}
                          {r.work_category ? ` · ${r.work_category}` : null}
                        </p>
                        <p className="mt-2 line-clamp-2 text-sm text-slate-700">{r.description}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-full bg-white px-2.5 py-1 font-semibold text-slate-700 ring-1 ring-slate-200">
                            {DIRECT_REQUEST_STATUS_LABEL[r.status]}
                          </span>
                          <span className="text-slate-500">
                            {new Date(r.created_at).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })}
                          </span>
                        </div>
                        {ex ? (
                          <Link
                            to={`/creators/${encodeURIComponent(ex.id)}`}
                            className="mt-2 inline-block text-xs font-bold text-brand-800 hover:underline"
                          >
                            내 전문가 프로필
                          </Link>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-600">
                  아직 받은 직접 의뢰가 없습니다.
                </p>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {!isCreator ? (
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">고객 유입 링크·홍보 파트너 신청 관리</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
              내 명함에 고객 유입 링크로 참여하려는 홍보 파트너 신청을 확인하고 승인 또는 거절할 수 있습니다.
            </p>
          </div>
          {ownerPromotionApplications.length > 0 ? (
            <ul className="mt-5 grid gap-3">
              {ownerPromotionApplications.map((application) => {
                const card = businessCards.find((c) => c.id === application.card_id);
                const applicant = applicantLabel(application);
                return (
                  <li key={application.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{applicant.name}</p>
                        <p className="mt-1 text-xs text-slate-600">{applicant.email}</p>
                        <p className="mt-2 text-sm text-slate-700">
                          명함: {card ? cardDisplayName(card) : application.card_name ?? application.card_id}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          신청일 {new Date(application.created_at).toLocaleDateString("ko-KR")}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                          {application.status === "pending"
                            ? "승인 대기"
                            : application.status === "approved"
                              ? "승인 완료"
                              : "거절"}
                        </span>
                        <button
                          type="button"
                          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                          onClick={() => void decidePromotionApplication(application, "approved")}
                          disabled={application.status === "approved"}
                        >
                          승인
                        </button>
                        <button
                          type="button"
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-900 hover:bg-slate-50 disabled:opacity-50"
                          onClick={() => void decidePromotionApplication(application, "rejected")}
                          disabled={application.status === "rejected"}
                        >
                          거절
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              아직 고객 유입 링크 신청이 없습니다.
            </p>
          )}
        </section>
      ) : null}

      {uid && isSupabaseConfigured ? <AccountDeletionSection userId={uid} email={user?.email ?? null} /> : null}

      {!isCreator ? (
        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">활동 기록</h2>
          <p className="mt-3 text-sm text-slate-600">활동 기록은 준비 중입니다.</p>
        </div>
      ) : null}

      {withdrawalModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-8"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <p className="text-lg font-bold text-slate-900">출금 신청</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              출금 신청 후 관리자 확인을 거쳐 지급됩니다. 세금 및 정산 기준에 따라 지급 금액이 조정될 수 있습니다.
            </p>

            <div className="mt-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <p className="text-sm font-semibold text-slate-800">포함할 정산 가능 보상 선택</p>
              {confirmedSelectableRewards.length === 0 ? (
                <p className="text-sm text-slate-500">정산 가능한 보상이 없습니다.</p>
              ) : (
                confirmedSelectableRewards.map((r) => (
                  <label key={r.id} className="flex cursor-pointer items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={withdrawalSelectedIds.includes(r.id)}
                      onChange={() => toggleWithdrawalReward(r.id)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    <span className="tabular-nums">{r.reward_amount.toLocaleString()}원</span>
                    <span className="text-xs text-slate-500">
                      {new Date(r.created_at).toLocaleDateString("ko-KR")}
                    </span>
                  </label>
                ))
              )}
              <p className="pt-2 text-sm font-bold text-brand-900">
                선택 합계 {withdrawalSelectedSum.toLocaleString()}원
              </p>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700">은행명</label>
                <Input
                  className="mt-1"
                  value={withdrawalBankName}
                  onChange={(e) => setWithdrawalBankName(e.target.value)}
                  placeholder="예: 국민은행"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">계좌번호</label>
                <Input
                  className="mt-1 font-mono"
                  value={withdrawalBankAccount}
                  onChange={(e) => setWithdrawalBankAccount(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">예금주</label>
                <Input
                  className="mt-1"
                  value={withdrawalAccountHolder}
                  onChange={(e) => setWithdrawalAccountHolder(e.target.value)}
                />
              </div>
            </div>

            {withdrawalError ? <p className="mt-3 text-sm font-medium text-red-600">{withdrawalError}</p> : null}

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-900 hover:bg-slate-50"
                onClick={() => setWithdrawalModalOpen(false)}
                disabled={withdrawalBusy}
              >
                취소
              </button>
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-cta-500 px-4 text-sm font-bold text-white hover:bg-cta-600"
                onClick={() => void submitWithdrawalRequest()}
                disabled={withdrawalBusy}
              >
                {withdrawalBusy ? "처리 중…" : "신청하기"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {qrCard ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 text-center shadow-xl">
            <p className="text-lg font-bold text-slate-900">{cardDisplayName(qrCard)} QR</p>
            <p className="mt-1 break-all text-xs font-medium text-slate-500">
              {qrLink || resolveBusinessCardPublicUrl(qrCard, shareOrigin)}
            </p>
            <div className="mt-5 flex min-h-[220px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4">
              {qrDataUrl ? <img src={qrDataUrl} alt="명함 QR 코드" className="h-52 w-52" /> : <p className="text-sm text-slate-500">QR을 만들 수 없어요.</p>}
            </div>
            <button
              type="button"
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-bold text-white hover:bg-slate-800"
              onClick={() => {
                setQrCard(null);
                setQrDataUrl(null);
                setQrLink("");
              }}
            >
              닫기
            </button>
          </div>
        </div>
      ) : null}

      {extraCardModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <p className="text-lg font-bold text-slate-900">명함을 추가하시겠어요?</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              새로운 명함 1개를 추가하려면 {EXTRA_CARD_PRICE.toLocaleString()}원 결제가 필요합니다. 결제 후 바로 명함을 만들 수 있어요.
            </p>
            <div className="mt-4 rounded-2xl border border-cta-200 bg-cta-50 px-4 py-4">
              <p className="text-sm font-bold text-slate-900">결제 금액</p>
              <p className="mt-1 text-2xl font-extrabold text-cta-700">{EXTRA_CARD_PRICE.toLocaleString()}원</p>
            </div>
            <div className="mt-5 grid gap-2">
              <button
                type="button"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-cta-500 px-4 text-sm font-bold text-white hover:bg-cta-600 disabled:opacity-60"
                disabled={extraCardBusy}
                onClick={() => void confirmExtraCardPurchase()}
              >
                {EXTRA_CARD_PRICE.toLocaleString()}원 결제하고 명함 추가하기
              </button>
              <button
                type="button"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-900 hover:bg-slate-50"
                disabled={extraCardBusy}
                onClick={() => setExtraCardModalOpen(false)}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {promotionPaymentCard ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <p className="text-lg font-bold text-slate-900">고객 유입 링크 추가 (유료)</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{HELPER_LINK_PAYMENT_LEAD}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              결제 후 홍보 요청서를 작성하면 파트너 모집이 시작됩니다.
            </p>
            <div className="mt-4 rounded-2xl border border-cta-200 bg-cta-50 px-4 py-4">
              <p className="text-sm font-bold text-slate-900">결제 금액</p>
              <p className="mt-1 text-2xl font-extrabold text-cta-700">{PROMOTION_LINK_PRICE.toLocaleString()}원</p>
            </div>
            <div className="mt-5 grid gap-2">
              <button
                type="button"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-cta-500 px-4 text-sm font-bold text-white hover:bg-cta-600"
                onClick={() => void confirmPromotionPayment()}
              >
                {HELPER_LINK_PAYMENT_CTA}
              </button>
              <button
                type="button"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-900 hover:bg-slate-50"
                onClick={() => setPromotionPaymentCard(null)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
