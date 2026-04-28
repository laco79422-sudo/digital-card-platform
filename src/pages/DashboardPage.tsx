import { CardQrAndExportPanel } from "@/components/card-print/CardQrAndExportPanel";
import { BRAND_DISPLAY_NAME, brandCta } from "@/lib/brand";
import { buildNfcAcceptUrl } from "@/lib/siteOrigin";
import { buildCardShareUrl, resolveBusinessCardPublicUrl } from "@/lib/cardShareUrl";
import { shareCardLinkNativeOrder } from "@/lib/kakaoWebShare";
import { buildReferralCode } from "@/lib/referrals";
import {
  DESIGN_REQUEST_PAYMENT_STATUS_LABEL,
  DESIGN_REQUEST_STATUS_LABEL,
  DESIGN_REQUEST_STYLE_LABEL,
} from "@/lib/designRequestLabels";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { fetchMyCardsForUser, type FetchMyCardsResult } from "@/services/cardsService";
import { fetchMyDesignRequests, updateDesignRequestRemote } from "@/services/designRequestsService";
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
import type { BusinessCard, PromotionApplication, User } from "@/types/domain";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const CARD_MONTHLY_PRICE = 14900;

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

function cardDisplayName(card: BusinessCard): string {
  return card.person_name.trim() || card.brand_name.trim() || "이름 없는 명함";
}

function cardSubline(card: BusinessCard): string {
  return [card.job_title.trim(), card.brand_name.trim()].filter(Boolean).join(" · ") || "직업/회사명 미입력";
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

export function DashboardPage() {
  const navigate = useNavigate();
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
  const [referralCopyDone, setReferralCopyDone] = useState(false);
  const [referralShareHint, setReferralShareHint] = useState(false);
  const [cardCopyId, setCardCopyId] = useState<string | null>(null);
  const [nfcCopyCardId, setNfcCopyCardId] = useState<string | null>(null);
  const [promoCopyId, setPromoCopyId] = useState<string | null>(null);
  const [cardShareHintId, setCardShareHintId] = useState<string | null>(null);
  const [qrCard, setQrCard] = useState<BusinessCard | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrLink, setQrLink] = useState("");
  const [promotionPaymentCard, setPromotionPaymentCard] = useState<BusinessCard | null>(null);
  const [cardsFetch, setCardsFetch] = useState<FetchMyCardsResult>({
    status: "ok",
    cards: [],
    source: "none",
  });
  const [cardsLoading, setCardsLoading] = useState(false);

  const uid = user?.id ?? "";
  useEffect(() => {
    if (uid) ensureReferralRecord(uid);
  }, [ensureReferralRecord, uid]);

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

  const myCards = useMemo(
    () => (uid ? businessCards.filter((card) => cardBelongsToUser(card, user)) : []),
    [businessCards, uid, user],
  );
  const shareOrigin = typeof window !== "undefined" ? window.location.origin : "";
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
            (application) => application.applicant_user_id === uid && application.status === "approved" && application.promotion_url,
          )
        : [],
    [promotionApplications, uid],
  );

  const isCreator = user?.role === "creator";
  const displayName = safeDisplayName(user);
  const myReferral = uid ? referralRecords.find((r) => r.user_id === uid) : null;
  const refCode = myReferral?.ref_code ?? (uid ? buildReferralCode(uid) : "");
  const referredCount = myReferral?.referred_count ?? 0;
  const rewardMonths = myReferral?.reward_months ?? 0;
  const referralCard = myCards.find((card) => card.is_public && card.slug.trim()) ?? null;
  const referralLink = refCode && referralCard ? buildPromotionLink(referralCard, shareOrigin, refCode) : "";

  const copyReferralLink = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
    } catch {
      window.prompt("추천 링크를 복사해 주세요", referralLink);
    }
    setReferralCopyDone(true);
    window.setTimeout(() => setReferralCopyDone(false), 2200);
  };

  const shareReferralLink = async () => {
    if (!referralLink || !referralCard) return;
    const r = await shareCardLinkNativeOrder({
      shareUrl: referralLink,
      title: `${cardDisplayName(referralCard)} 추천 링크`,
      shortMessage: "이 명함 링크로 가입하면 디지털 명함 이용 혜택을 받을 수 있어요.",
      kakaoDescription: referralCard.intro.trim() || cardSubline(referralCard),
      kakaoImageUrl: referralCard.imageUrl?.trim() || referralCard.brand_image_url?.trim() || undefined,
    });
    if (r === "clipboard") {
      setReferralShareHint(true);
      window.setTimeout(() => setReferralShareHint(false), 3000);
    }
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

  const shareCard = async (card: BusinessCard) => {
    const url = resolveBusinessCardPublicUrl(card, shareOrigin) ?? "";
    if (!url) return;
    const r = await shareCardLinkNativeOrder({
      shareUrl: url,
      title: `${cardDisplayName(card)} 명함`,
      shortMessage: "내 디지털 명함 공개 링크예요.",
      kakaoDescription: card.intro.trim() || cardSubline(card),
      kakaoImageUrl: card.imageUrl?.trim() || card.brand_image_url?.trim() || undefined,
    });
    if (r === "clipboard") {
      setCardShareHintId(card.id);
      window.setTimeout(() => setCardShareHintId(null), 3000);
    }
  };

  const payForCardExtension = (card: BusinessCard) => {
    if (!uid) return;
    if (!window.confirm(`${CARD_MONTHLY_PRICE.toLocaleString()}원 결제 후 이 명함을 한 달 연장할까요?`)) {
      return;
    }
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
  };

  const startAdditionalCard = () => {
    if (myCards.length >= 1) {
      if (
        !window.confirm(
          `무료 명함은 1개까지 이용할 수 있어요. ${CARD_MONTHLY_PRICE.toLocaleString()}원 결제 후 새 명함을 만들까요?`,
        )
      ) {
        return;
      }
      if (uid) {
        addPayment({
          id: crypto.randomUUID(),
          user_id: uid,
          amount: CARD_MONTHLY_PRICE,
          payment_type: "additional_card_create",
          status: "completed",
          created_at: new Date().toISOString(),
        });
      }
    }
    navigate("/cards/new");
  };

  const openPromotionPayment = (card: BusinessCard) => {
    setPromotionPaymentCard(card);
  };

  const confirmPromotionPayment = async () => {
    if (!promotionPaymentCard || !uid) return;
    await startPromotionLinkPayment(promotionPaymentCard.id);
    await handlePromotionLinkPaymentSuccess(promotionPaymentCard.id);
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
    setPromotionPaymentCard(null);
  };

  const applicantLabel = (application: PromotionApplication): { name: string; email: string } => {
    const platformUser = platformUsers.find((u) => u.id === application.applicant_user_id);
    return {
      name: application.applicant_name ?? platformUser?.name ?? "홍보 신청자",
      email: application.applicant_email ?? platformUser?.email ?? application.applicant_user_id,
    };
  };

  const decidePromotionApplication = async (application: PromotionApplication, status: "approved" | "rejected") => {
    const card = businessCards.find((c) => c.id === application.card_id);
    const promoterCode = status === "approved" ? application.promoter_code ?? buildPromoterCode(application.card_id, application.applicant_user_id) : application.promoter_code;
    const promotionUrl =
      status === "approved" && card?.slug ? buildPromotionUrl(shareOrigin, card.slug, promoterCode ?? "") : application.promotion_url;
    const patch: Partial<PromotionApplication> = {
      status,
      promoter_code: promoterCode ?? null,
      promotion_url: promotionUrl ?? null,
      approved_at: status === "approved" ? new Date().toISOString() : application.approved_at,
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
      title: `${cardDisplayName(card)} 홍보 링크`,
      shortMessage: "이 홍보 링크로 소개해 주세요.",
      kakaoDescription: card.intro.trim() || cardSubline(card),
      kakaoImageUrl: card.imageUrl?.trim() || card.brand_image_url?.trim() || undefined,
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
          <StatBlock key="client-cards" label="내 명함" value={String(myCards.length)} sub="실제 프로필 페이지예요" />
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
          <StatBlock
            key="client-requests"
            label="진행 중 의뢰"
            value={String(myOpenRequests + myDesignRequests.filter((r) => r.status !== "completed").length)}
          />
        )}
      </div>

      {!isCreator ? (
        <section className="mt-8 rounded-2xl border border-brand-200/80 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">진행 중 의뢰</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                명함 디자인 전문가에게 맡긴 제작 의뢰와 시안 상태를 확인합니다.
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
              <p className="mt-2 text-sm text-slate-500">필요하면 전문가에게 명함 디자인 제작을 맡길 수 있어요.</p>
            </div>
          )}
        </section>
      ) : null}

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">내 명함</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
              내 명함은 실제 프로필 페이지이고, 공개 링크와 홍보 링크는 이 명함으로 들어오는 공유 경로예요.
            </p>
          </div>
          {!isCreator ? (
            cardsActuallyEmpty ? (
              <Link
                to="/cards/new"
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-cta-500 px-4 text-sm font-bold text-white shadow-sm shadow-cta-900/20 hover:bg-cta-600"
              >
                {brandCta.createDigitalCard}
              </Link>
            ) : myCards.length > 0 ? (
              <div className="max-w-xs">
                <button
                  type="button"
                  className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-xl bg-cta-500 px-4 text-sm font-bold text-white shadow-sm shadow-cta-900/20 hover:bg-cta-600"
                  onClick={startAdditionalCard}
                >
                  새 명함 만들기
                </button>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  새로운 명함을 추가로 만듭니다. 추가 명함은 유료로 이용할 수 있어요.
                </p>
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
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
            <p className="text-lg font-bold text-slate-900">아직 만든 명함이 없어요.</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
              현재 로그인 계정으로 연결된 명함을 찾지 못했습니다. 이전 계정 이메일로 만든 명함도 함께 확인했습니다.
            </p>
            {!isCreator ? (
              <Link
                to="/cards/new"
                className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-cta-500 px-5 text-base font-bold text-white shadow-sm shadow-cta-900/20 hover:bg-cta-600"
              >
                {brandCta.createDigitalCard}
              </Link>
            ) : null}
          </div>
        ) : (
          <ul className="mt-6 grid gap-4 lg:grid-cols-2">
            {myCards.map((card) => {
              const imageUrl = card.imageUrl?.trim() || card.brand_image_url?.trim() || "";
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

              return (
                <li key={card.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex gap-4">
                    <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 ring-1 ring-slate-200">
                      {imageUrl ? (
                        <img src={imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center px-3 text-center text-xs font-semibold text-slate-500">
                          기본 썸네일
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-bold text-slate-900">{cardDisplayName(card)}</h3>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                          {card.is_public ? "공개" : "비공개"}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-semibold",
                            access.expired ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700",
                          )}
                        >
                          {access.statusLabel}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm text-slate-600">{cardSubline(card)}</p>
                      <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                        <p className="text-xs font-bold text-slate-700">공개 링크 (일반 공유)</p>
                        <p className="mt-1 break-all text-xs font-semibold text-brand-800">
                          {publicUrl || "/c/ 주소 미설정"}
                        </p>
                      </div>
                      <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                        <p className="text-xs font-bold text-slate-700">NFC 태그용 링크</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600">
                          이 링크를 NFC 태그에 저장하면, 상대방이 태그했을 때 수락 후 명함을 볼 수 있습니다.
                        </p>
                        <button
                          type="button"
                          className="mt-3 inline-flex min-h-9 items-center justify-center rounded-xl bg-slate-900 px-3 text-xs font-bold text-white hover:bg-slate-800"
                          onClick={() => void copyNfcLink(card)}
                        >
                          {nfcCopyCardId === card.id ? "복사됨" : "NFC 링크 복사"}
                        </button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1">총 조회 {cardViewCount}</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1">클릭 수 {cardClickCount}</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1">
                          만료일 {new Date(access.expireAt).toLocaleDateString("ko-KR")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <CardQrAndExportPanel card={card} />
                  </div>

                  {access.expired ? (
                    <div className="mt-4 rounded-2xl border border-cta-200 bg-cta-50 px-4 py-4">
                      <p className="text-sm font-bold text-slate-900">
                        이 명함의 한 달 이용 기간이 끝났어요.
                      </p>
                      <p className="mt-1 text-sm text-slate-600">계속 이용하려면 결제가 필요합니다.</p>
                      <button
                        type="button"
                        className="mt-3 inline-flex min-h-10 items-center justify-center rounded-xl bg-cta-500 px-4 text-sm font-bold text-white hover:bg-cta-600"
                        onClick={() => payForCardExtension(card)}
                      >
                        14,900원 결제하고 한 달 연장
                      </button>
                    </div>
                  ) : null}

                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
                    <Link
                      to={publicUrl || `/c/${encodeURIComponent(card.slug)}`}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-900 px-3 text-sm font-bold text-white hover:bg-slate-800"
                    >
                      보기
                    </Link>
                    {canEditCard ? (
                      <Link
                        to={`/cards/${encodeURIComponent(card.id)}/edit`}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900 hover:bg-slate-50"
                      >
                        수정
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-cta-200 bg-cta-50 px-3 text-sm font-bold text-cta-700 hover:bg-cta-100"
                      onClick={() => void shareCard(card)}
                    >
                      공유
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
                      className="inline-flex min-h-10 items-center justify-center rounded-xl bg-cta-500 px-3 text-sm font-bold text-white hover:bg-cta-600"
                      onClick={() => openPromotionPayment(card)}
                    >
                      홍보 링크 추가
                    </button>
                  </div>
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
                </li>
              );
            })}
          </ul>
        )}
      </section>

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

      {!isCreator ? (
        <section className="mt-10 rounded-2xl border border-brand-200/80 bg-gradient-to-br from-brand-50 via-white to-sky-50 p-4 shadow-sm sm:p-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">내 홍보 링크</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
              승인된 홍보 링크입니다. 이 링크로 공유하면 내 홍보 활동으로 기록됩니다.
            </p>
          </div>
          {approvedPromotions.length > 0 ? (
            <ul className="mt-5 grid gap-4 lg:grid-cols-2">
              {approvedPromotions.map((application) => {
                const card = businessCards.find((c) => c.id === application.card_id);
                const promotionUrl = application.promotion_url ?? "";
                return (
                  <li key={application.id} className="rounded-2xl border border-brand-100 bg-white px-4 py-4">
                    <p className="text-sm font-bold text-slate-900">
                      {card ? cardDisplayName(card) : application.card_name ?? "홍보 중인 명함"}
                    </p>
                    <p className="mt-2 break-all rounded-xl bg-brand-50 px-3 py-3 text-xs font-semibold text-brand-900">
                      {promotionUrl}
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <button
                        type="button"
                        className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-50 px-3 text-sm font-bold text-slate-900 ring-1 ring-slate-200 hover:bg-slate-100"
                        onClick={() => void copyPromotionLink(promotionUrl, application.id)}
                      >
                        {promoCopyId === application.id ? "복사됨" : "링크 복사"}
                      </button>
                      {card ? (
                        <button
                          type="button"
                          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-50 px-3 text-sm font-bold text-slate-900 ring-1 ring-slate-200 hover:bg-slate-100"
                          onClick={() => void sharePromotionLink(card, promotionUrl)}
                        >
                          카카오톡 공유
                        </button>
                      ) : null}
                      {card ? (
                        <button
                          type="button"
                          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-50 px-3 text-sm font-bold text-slate-900 ring-1 ring-slate-200 hover:bg-slate-100"
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
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-bold text-brand-800">내 추천 링크</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900 sm:text-xl">추천하고 이용권 혜택 받기</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                내 명함 링크로 다른 사람이 가입하면 이용 혜택을 받을 수 있어요.
              </p>
            </div>
            <div className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200">
              추천 가입자 {referredCount}명 / 10명
            </div>
          </div>

          <div className="mt-5">
            <p className="text-sm font-semibold text-slate-800">내 추천 링크 주소</p>
            <p className="mt-2 break-all rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm font-semibold text-brand-900">
              {referralLink || "명함을 만든 뒤 추천 링크가 생성됩니다."}
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-cta-500 px-4 text-sm font-bold text-white shadow-sm shadow-cta-900/20 hover:bg-cta-600"
              onClick={() => void copyReferralLink()}
              disabled={!referralLink}
            >
              {referralCopyDone ? "복사됐어요" : "링크 복사하기"}
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-900 hover:bg-slate-50"
              onClick={() => void shareReferralLink()}
              disabled={!referralLink}
            >
              카카오톡으로 공유하기
            </button>
          </div>
          {referralShareHint ? (
            <p className="mt-3 text-sm font-medium text-brand-800">
              카카오톡 공유가 어려워 추천 링크를 복사했어요. 대화방에 붙여넣어 주세요.
            </p>
          ) : null}

          <div className="mt-5 rounded-xl border border-slate-200 bg-white/80 px-4 py-4">
            <p className="text-sm font-bold text-slate-900">혜택 안내</p>
            <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-slate-700">
              <li>10명이 가입하면 14,900원 이용권 1개월 무료</li>
              <li>20명이 가입하면 14,900원 이용권 2개월 무료</li>
            </ul>
            <p className="mt-3 text-sm font-semibold text-brand-900">
              현재 적용 가능 혜택: 14,900원 이용권 {rewardMonths}개월 무료
            </p>
          </div>
        </section>
      ) : null}

      {!isCreator ? (
        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">활동 기록</h2>
          <p className="mt-3 text-sm text-slate-600">활동 기록은 준비 중입니다.</p>
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
