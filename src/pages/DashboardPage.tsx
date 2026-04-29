import { Input } from "@/components/ui/Input";
import { CardQrAndExportPanel } from "@/components/card-print/CardQrAndExportPanel";
import { BRAND_DISPLAY_NAME } from "@/lib/brand";
import { buildNfcAcceptUrl, canonicalSiteOrigin } from "@/lib/siteOrigin";
import { buildCardShareUrl, resolveBusinessCardPublicUrl } from "@/lib/cardShareUrl";
import { shareCardLinkNativeOrder } from "@/lib/kakaoWebShare";
import { buildReferralCode, buildSignupReferralUrl, rewardMonthsForReferralCount } from "@/lib/referrals";
import {
  DESIGN_REQUEST_PAYMENT_STATUS_LABEL,
  DESIGN_REQUEST_STATUS_LABEL,
  DESIGN_REQUEST_STYLE_LABEL,
} from "@/lib/designRequestLabels";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { buildCardPublicShareUrl, copyLinkToClipboard } from "@/lib/copyShareLink";
import { getCardHeroImageUrl } from "@/lib/businessCardHeroImage";
import {
  createAdditionalCard,
  EXTRA_CARD_PRICE,
  handleExtraCardPaymentSuccess,
  startExtraCardPayment,
} from "@/services/extraCardPaymentService";
import {
  fetchCardVisitLogsForOwner,
  fetchCardVisitLogsForPromoterApplicant,
} from "@/services/cardVisitLogsService";
import { fetchMyCardsForUser, type FetchMyCardsResult } from "@/services/cardsService";
import { fetchMyDesignRequests, updateDesignRequestRemote } from "@/services/designRequestsService";
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
  fetchReferralSignupCount,
} from "@/services/referralService";
import {
  buildPromoterCode,
  buildPromotionUrl,
  fetchPromotionApplicationsForApplicant,
  fetchPromotionApplicationsForOwner,
  handlePromotionLinkPaymentSuccess,
  PROMOTION_LINK_PRICE,
  startPromotionLinkPayment,
  updatePromotionApplicationRemote,
} from "@/services/promotionService";
import { useAuthStore } from "@/stores/authStore";
import { useAppDataStore } from "@/stores/appDataStore";
import type { BusinessCard, CardVisitLog, PromotionApplication, User } from "@/types/domain";
import QRCode from "qrcode";
import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const CARD_MONTHLY_PRICE = 14900;
const MIN_WITHDRAWAL_KRW = 10000;

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
  const [referralRewardRows, setReferralRewardRows] = useState<ReferralRewardRow[]>([]);
  const [rewardClawbackPending, setRewardClawbackPending] = useState(0);
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);
  const [withdrawalBankName, setWithdrawalBankName] = useState("");
  const [withdrawalBankAccount, setWithdrawalBankAccount] = useState("");
  const [withdrawalAccountHolder, setWithdrawalAccountHolder] = useState("");
  const [withdrawalSelectedIds, setWithdrawalSelectedIds] = useState<string[]>([]);
  const [withdrawalBusy, setWithdrawalBusy] = useState(false);
  const [withdrawalError, setWithdrawalError] = useState<string | null>(null);

  const uid = user?.id ?? "";
  useEffect(() => {
    const st = location.state as { openExtraCardModal?: boolean } | null | undefined;
    if (st?.openExtraCardModal) {
      setExtraCardModalOpen(true);
      navigate("/dashboard", { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  useEffect(() => {
    if (uid) ensureReferralRecord(uid);
  }, [ensureReferralRecord, uid]);

  useEffect(() => {
    if (!uid) {
      setProfileReferralCodeDb(null);
      setReferralSignupCountDb(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      await claimPendingReferral();
      const [code, count] = await Promise.all([fetchProfileReferralCode(uid), fetchReferralSignupCount(uid)]);
      if (cancelled) return;
      setProfileReferralCodeDb(code);
      setReferralSignupCountDb(count);
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const reloadReferralRewards = useCallback(async () => {
    if (!uid) {
      setReferralRewardRows([]);
      setRewardClawbackPending(0);
      return;
    }
    const [rows, claw] = await Promise.all([
      fetchReferralRewardsForReferrer(uid),
      fetchPendingClawbacksSum(uid),
    ]);
    setReferralRewardRows(rows);
    setRewardClawbackPending(claw);
  }, [uid]);

  useEffect(() => {
    void reloadReferralRewards();
  }, [reloadReferralRewards]);

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
  const shareOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const promoteOrigin = canonicalSiteOrigin();
  const myCardIds = useMemo(() => new Set(myCards.map((c) => c.id)), [myCards]);

  const viewsCount = cardViews.filter((v) => myCardIds.has(v.card_id)).length;
  const clicksCount = cardClicks.filter((c) => myCardIds.has(c.card_id)).length;

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
  const referralLink = refCode ? buildSignupReferralUrl(canonicalSiteOrigin(), refCode) : "";

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
    await copyLinkToClipboard(referralLink, "referral");
  };

  const copyMyCardPublicLink = async (card: BusinessCard) => {
    const url = buildCardPublicShareUrl(card.slug ?? "");
    if (!url) {
      alert("공개 링크를 만들 수 없습니다. 명함 슬러그(/c/주소)를 확인해 주세요.");
      return;
    }
    await copyLinkToClipboard(url, "card");
  };

  const copyCardLink = async (card: BusinessCard) => {
    const url = resolveBusinessCardPublicUrl(card, shareOrigin) ?? "";
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("공개 링크를 복사해 주세요", url);
    }
    setCardCopyId(card.id);
    window.setTimeout(() => setCardCopyId(null), 2200);
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

  const openPromotionPayment = (card: BusinessCard) => {
    setPromotionPaymentCard(card);
  };

  const confirmPromotionPayment = async () => {
    if (!promotionPaymentCard || !uid) return;
    await startPromotionLinkPayment(promotionPaymentCard.id);
    await handlePromotionLinkPaymentSuccess(promotionPaymentCard.id);
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
    upsertBusinessCard({
      ...promotionPaymentCard,
      promotion_enabled: true,
      promotion_payment_status: "paid",
      promotion_price: PROMOTION_LINK_PRICE,
    });
    void reloadReferralRewards();
    setPromotionPaymentCard(null);
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
      name: application.applicant_name ?? platformUser?.name ?? "홍보 신청자",
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
    const name = app.applicant_name ?? platformUser?.name ?? "홍보 신청자";
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
      window.prompt("홍보 링크를 복사해 주세요", promoUrl);
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
        </div>
        <div className="flex flex-wrap gap-2">
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
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">내 명함</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
              {myCards.length >= 1
                ? "추가 명함은 1개당 10,900원 결제 후 만들 수 있습니다."
                : "내 명함은 실제 프로필 페이지이고, 공개 링크와 홍보 링크는 이 명함으로 들어오는 공유 경로예요."}
            </p>
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
            className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center"
          >
            <p className="text-lg font-bold text-slate-900">아직 만든 명함이 없어요.</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
              먼저 내 명함을 만들고 링크·QR·NFC로 공유해 보세요.
            </p>
            {!isCreator ? (
              <Link
                to="/cards/new"
                className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-cta-500 px-5 text-base font-bold text-white shadow-sm shadow-cta-900/20 hover:bg-cta-600"
              >
                내 명함 만들기
              </Link>
            ) : null}
          </div>
        ) : (
          <ul className="mt-6 grid gap-4 lg:grid-cols-2">
            {myCards.map((card) => {
              const imageUrl = getCardHeroImageUrl(card);
              const publicUrl = resolveBusinessCardPublicUrl(card, shareOrigin) ?? "";
              const cardViewCount = cardViews.filter((v) => v.card_id === card.id).length;
              const cardClickCount = cardClicks.filter((c) => c.card_id === card.id).length;
              const canEditCard = cardBelongsToUser(card, user);
              const access = cardAccessInfo(card);
              const promotionLinks = [
                { id: `base-${card.id}`, ref_code: refCode, label: "기본 홍보 링크" },
                ...cardPromotionLinks
                  .filter((link) => link.card_id === card.id)
                  .map((link, index) => ({
                    id: link.id,
                    ref_code: link.ref_code,
                    label: `추가 홍보 링크 ${index + 1}`,
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
                      {imageUrl ? (
                        <img src={imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-full min-h-[148px] w-full items-center justify-center px-4 text-center text-sm font-semibold text-slate-500">
                          기본 썸네일
                        </div>
                      )}
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
                      <p className="text-xs font-bold text-slate-700">공개 링크</p>
                      <p className="mt-1 break-all text-xs font-semibold text-brand-800">
                        {publicUrl || "/c/ 주소 미설정"}
                      </p>
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
                          onClick={() => void payForCardExtension(card)}
                        >
                          14,900원 결제하고 한 달 연장
                        </button>
                      </div>
                    ) : null}

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
                      <Link
                        to={publicUrl || `/c/${encodeURIComponent(card.slug ?? "")}`}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-900 px-3 text-sm font-bold text-white hover:bg-slate-800"
                      >
                        보기
                      </Link>
                      {canEditCard ? (
                        <Link
                          to={`/cards/${encodeURIComponent(card.id)}/edit`}
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900 hover:bg-slate-50"
                        >
                          바로 수정
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-amber-300 bg-amber-50 px-3 text-sm font-bold text-amber-950 hover:bg-amber-100"
                        onClick={() => void copyMyCardPublicLink(card)}
                      >
                        링크 복사하기
                      </button>
                      <button
                        type="button"
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900 hover:bg-slate-50"
                        onClick={() => void openQr(card)}
                      >
                        QR 보기
                      </button>
                      <button
                        type="button"
                        className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-900 px-3 text-xs font-bold text-white hover:bg-slate-800 sm:text-sm"
                        onClick={() => void copyNfcLink(card)}
                      >
                        {nfcCopyCardId === card.id ? "복사됨" : "NFC 링크 복사"}
                      </button>
                      <button
                        type="button"
                        className="inline-flex min-h-10 items-center justify-center rounded-xl bg-cta-500 px-3 text-sm font-bold text-white hover:bg-cta-600"
                        onClick={() => openPromotionPayment(card)}
                      >
                        홍보 링크 추가
                      </button>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-slate-500">
                      링크 복사하기를 누르면 명함 주소가 복사됩니다. 카카오톡, 문자, SNS 대화창에 붙여넣어 공유할 수 있어요.
                    </p>
                  <button
                    type="button"
                    className="mt-2 text-xs font-semibold text-slate-500 underline underline-offset-4 hover:text-slate-800"
                    onClick={() => void copyCardLink(card)}
                  >
                    {cardCopyId === card.id ? "공개 링크 복사됨" : "공개 링크 복사"}
                  </button>
                  {cardShareHintId === card.id ? (
                    <p className="mt-2 text-sm font-medium text-brand-800">
                      카카오톡 공유가 어려워 공개 링크를 복사했어요. 대화방에 붙여넣어 주세요.
                    </p>
                  ) : null}
                  <div className="mt-4 rounded-2xl border border-brand-100 bg-brand-50/50 px-4 py-4">
                    <p className="text-sm font-bold text-slate-900">내 홍보 링크 (추천용)</p>
                    <p className="mt-1 text-xs font-medium text-slate-600">
                      이 링크로 가입하면 혜택을 받을 수 있어요. 명함은 하나이고, 링크만 목적별로 나뉩니다.
                    </p>
                    <div className="mt-3 space-y-3">
                      {promotionLinks.map((link) => {
                        const linkUrl = buildPromotionLink(card, shareOrigin, link.ref_code);
                        const visitCount = cardLinkVisits.filter(
                          (visit) => visit.card_id === card.id && visit.ref_code === link.ref_code,
                        ).length;
                        const signupCount = referralRecords.filter((record) => record.referred_by === link.ref_code).length;
                        return (
                          <div key={link.id} className="rounded-2xl border border-brand-100 bg-white px-3 py-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-xs font-bold text-slate-800">{link.label}</p>
                              <p className="text-xs font-semibold text-slate-500">
                                조회수 {visitCount} · 가입수 {signupCount}
                              </p>
                            </div>
                            <p className="mt-2 break-all text-xs font-semibold text-brand-900">{linkUrl}</p>
                            <div className="mt-3 grid gap-2 sm:grid-cols-3">
                              <button
                                type="button"
                                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-50 px-3 text-sm font-bold text-slate-900 ring-1 ring-slate-200 hover:bg-slate-100"
                                onClick={() => void copyPromotionLink(linkUrl, link.id)}
                              >
                                {promoCopyId === link.id ? "복사됨" : "홍보 링크 복사"}
                              </button>
                              <button
                                type="button"
                                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-50 px-3 text-sm font-bold text-slate-900 ring-1 ring-slate-200 hover:bg-slate-100"
                                onClick={() => void sharePromotionLink(card, linkUrl)}
                              >
                                카카오톡으로 홍보하기
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
                      onClick={() => openPromotionPayment(card)}
                    >
                      {card.promotion_enabled ? "홍보 신청 받는 중" : "홍보 링크 추가"}
                    </button>
                  </div>
                  {showPromotionPerf ? (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
                      <h3 className="text-sm font-bold text-slate-900">홍보 파트너별 성과</h3>
                      {promotionPerfRows.length === 0 ? (
                        <p className="mt-3 text-sm text-slate-500">
                          아직 홍보 방문 기록이 없어요. 홍보 링크를 승인하고 공유가 시작되면 이곳에 데이터가 쌓입니다.
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
                                <th className="py-2">홍보 링크</th>
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

      {uid && myCards.length > 0 ? (
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">홍보 현황</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
            가입자들의 홍보 활동은 실시간으로 집계되며, 누가 더 많은 고객을 연결하고 있는지 한눈에 확인할 수 있습니다.
          </p>
          {visitOwnerStats.totalVisits === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
              <p className="text-base font-medium text-slate-700">아직 홍보 방문 기록이 없어요.</p>
              <p className="mt-2 text-sm text-slate-500">
                홍보 링크를 승인하고 공유가 시작되면 이곳에 데이터가 쌓입니다.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <StatBlock label="총 방문 수" value={String(visitOwnerStats.totalVisits)} />
              <StatBlock label="홍보 링크 방문" value={String(visitOwnerStats.promotionVisits)} />
              <StatBlock label="직접 방문" value={String(visitOwnerStats.directVisits)} />
              <StatBlock label="참여 홍보 파트너 수" value={String(visitOwnerStats.promoterCount)} />
              <StatBlock label="최고 성과 홍보 파트너" value={topPromoterDisplay} />
            </div>
          )}
        </section>
      ) : null}

      {!isCreator ? (
        <section className="mt-8 rounded-2xl border border-brand-200/80 bg-white p-4 shadow-sm sm:p-6">
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

      {!isCreator ? (
        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">홍보 신청 관리</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
              내 명함을 홍보하려는 홍보 신청자를 확인하고 승인 또는 거절할 수 있습니다.
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
              아직 홍보 신청자가 없습니다.
            </p>
          )}
        </section>
      ) : null}

      {uid ? (
        <section className="mt-10 rounded-2xl border border-brand-200/80 bg-gradient-to-br from-brand-50 via-white to-sky-50 p-4 shadow-sm sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">내 홍보 성과</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
              승인된 홍보 링크로 유입된 방문 수와 최근 활동을 확인할 수 있습니다. 이 링크로 공유하면 내 홍보 활동으로 기록됩니다.
            </p>
          </div>
          {approvedPromotions.length > 0 ? (
            <ul className="mt-5 grid gap-4 lg:grid-cols-2">
              {approvedPromotions.map((application) => {
                const card = businessCards.find((c) => c.id === application.card_id);
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
                    <p className="mt-3 text-xs font-bold text-slate-600">내 홍보 링크</p>
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
          ) : (
            <p className="mt-5 rounded-2xl border border-dashed border-brand-200 bg-white/70 px-4 py-6 text-center text-sm text-slate-500">
              승인된 홍보 링크가 아직 없습니다. 홍보 가능한 명함에서 먼저 홍보 신청을 해 주세요.
            </p>
          )}
        </section>
      ) : null}

      {!isCreator ? (
        <section className="mt-10 rounded-2xl border border-brand-200/80 bg-gradient-to-br from-brand-50 via-white to-sky-50 p-4 shadow-sm sm:p-6">
          <div className="rounded-xl border border-brand-100 bg-white/70 px-4 py-4">
            <p className="text-sm font-bold text-brand-900">이용 안내</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">추천하고 결제 보상 받기</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              내 추천 링크로 가입한 사용자가 유료 결제를 하면, 결제 금액의 10%가 추천 보상으로 적립됩니다. 적립된 보상은 출금 신청을 통해 받을 수 있습니다.
            </p>
            <p className="mt-3 text-sm font-medium text-slate-800">보상 예시</p>
            <ul className="mt-1 list-inside list-disc text-sm text-slate-600">
              <li>14,900원 결제 시 1,490원 적립</li>
              <li>59,000원 결제 시 5,900원 적립</li>
            </ul>
          </div>

          <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <h3 className="text-lg font-semibold text-slate-900 sm:text-xl">내 추천 링크</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                가입하면 나만의 추천링크가 자동으로 만들어집니다. 이 링크를 비회원에게 보내 린코를 소개할 수 있어요. 추천받은
                사람이 가입하고 결제하면 추천 보상을 받을 수 있습니다.
              </p>
              <p className="mt-3 text-xs leading-relaxed text-slate-500">
                명함 공유 주소(<span className="font-mono">/c/···</span>)와 추천링크(<span className="font-mono">/?ref=···</span>)는
                목적이 다릅니다. 소개·가입 유도에는 추천링크를 사용해 주세요.
              </p>
            </div>
            <div className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200">
              추천 가입자 {referredCount}명 / 5명
            </div>
          </div>

          <div className="mt-5">
            <p className="text-sm font-semibold text-slate-800">추천링크 주소</p>
            <p className="mt-2 break-all rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm font-semibold text-brand-900">
              {referralLink || "추천링크를 불러오는 중입니다."}
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-cta-500 px-4 text-sm font-bold text-white shadow-sm shadow-cta-900/20 hover:bg-cta-600"
              onClick={() => void copyReferralLink()}
              disabled={!referralLink}
            >
              추천링크 복사하기
            </button>
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
              내 추천 링크로 가입한 사용자가 결제하면 결제 금액의 10%가 보상으로 적립됩니다. 추천 보상은 실제 결제 완료 건에 대해서만 적립되며, 환불 시 보상은 취소되거나 조정될 수 있습니다. 출금은 관리자 확인 후 지급됩니다.
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
            <p className="text-lg font-bold text-slate-900">홍보 링크 추가</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              이 명함을 가입자들이 홍보할 수 있도록 공개합니다. 홍보 링크를 추가하면, 가입자들이 홍보 신청을 할 수 있고 승인된 가입자는 전용 공유 링크를 받습니다.
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
                10,900원 결제하고 홍보 시작하기
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
