import { BRAND_DISPLAY_NAME, brandCta } from "@/lib/brand";
import { buildCardShareUrl, resolveBusinessCardPublicUrl } from "@/lib/cardShareUrl";
import { shareCardLinkNativeOrder } from "@/lib/kakaoWebShare";
import { buildReferralCode } from "@/lib/referrals";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { fetchMyCards } from "@/services/cardsService";
import { useAuthStore } from "@/stores/authStore";
import { useAppDataStore } from "@/stores/appDataStore";
import type { BusinessCard, User } from "@/types/domain";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const CARD_MONTHLY_PRICE = 14900;
const PROMOTION_LINK_PRICE = 10900;

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

function buildRandomPromotionRefCode(existingCodes: Set<string>): string {
  for (let i = 0; i < 10; i += 1) {
    const code = `LINKO${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    if (!existingCodes.has(code)) return code;
  }
  return `LINKO${Date.now().toString(36).toUpperCase()}`;
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
  const applications = useAppDataStore((s) => s.applications);
  const referralRecords = useAppDataStore((s) => s.referralRecords);
  const ensureReferralRecord = useAppDataStore((s) => s.ensureReferralRecord);
  const upsertBusinessCard = useAppDataStore((s) => s.upsertBusinessCard);
  const addPayment = useAppDataStore((s) => s.addPayment);
  const extendCardAccess = useAppDataStore((s) => s.extendCardAccess);
  const addCardPromotionLink = useAppDataStore((s) => s.addCardPromotionLink);
  const [referralCopyDone, setReferralCopyDone] = useState(false);
  const [referralShareHint, setReferralShareHint] = useState(false);
  const [cardCopyId, setCardCopyId] = useState<string | null>(null);
  const [promoCopyId, setPromoCopyId] = useState<string | null>(null);
  const [cardShareHintId, setCardShareHintId] = useState<string | null>(null);
  const [qrCard, setQrCard] = useState<BusinessCard | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrLink, setQrLink] = useState("");

  const uid = user?.id ?? "";
  useEffect(() => {
    if (uid) ensureReferralRecord(uid);
  }, [ensureReferralRecord, uid]);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    void fetchMyCards(uid).then((cards) => {
      if (cancelled || !cards) return;
      for (const card of cards) upsertBusinessCard(card);
    });
    return () => {
      cancelled = true;
    };
  }, [uid, upsertBusinessCard]);

  const myCards = useMemo(
    () => (uid ? businessCards.filter((c) => c.user_id === uid) : []),
    [businessCards, uid],
  );
  const shareOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const myCardIds = useMemo(() => new Set(myCards.map((c) => c.id)), [myCards]);

  const viewsCount = cardViews.filter((v) => myCardIds.has(v.card_id)).length;
  const clicksCount = cardClicks.filter((c) => myCardIds.has(c.card_id)).length;

  const myOpenRequests = uid
    ? requests.filter((r) => r.client_user_id === uid && r.status === "open").length
    : 0;

  const myApps = uid ? applications.filter((a) => a.creator_user_id === uid) : [];

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

  const addPromotionLink = (card: BusinessCard) => {
    if (!uid) return;
    if (
      !window.confirm(
        "홍보 링크를 추가하려면 10,900원이 필요합니다.\n결제 후 새로운 홍보 링크가 생성됩니다.",
      )
    ) {
      return;
    }
    const existingCodes = new Set([
      ...referralRecords.map((r) => r.ref_code),
      ...cardPromotionLinks.map((link) => link.ref_code),
    ]);
    const ref_code = buildRandomPromotionRefCode(existingCodes);
    addPayment({
      id: crypto.randomUUID(),
      user_id: uid,
      card_id: card.id,
      amount: PROMOTION_LINK_PRICE,
      payment_type: "promotion_link_add",
      status: "completed",
      created_at: new Date().toISOString(),
    });
    addCardPromotionLink({
      id: crypto.randomUUID(),
      card_id: card.id,
      ref_code,
      type: "promotion",
      created_at: new Date().toISOString(),
    });
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
          <StatBlock key="client-requests" label="진행 중 의뢰" value={String(myOpenRequests)} />
        )}
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">내 명함</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
              내 명함은 실제 프로필 페이지이고, 공개 링크와 홍보 링크는 이 명함으로 들어오는 공유 경로예요.
            </p>
          </div>
          {!isCreator ? (
            myCards.length === 0 ? (
              <Link
                to="/cards/new"
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-cta-500 px-4 text-sm font-bold text-white shadow-sm shadow-cta-900/20 hover:bg-cta-600"
              >
                {brandCta.createDigitalCard}
              </Link>
            ) : (
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
            )
          ) : null}
        </div>

        {myCards.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
            <p className="text-lg font-bold text-slate-900">아직 만든 명함이 없어요.</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
              먼저 내 명함을 만들고, 공개 링크나 홍보 링크로 공유해 보세요.
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
              const canEditCard = Boolean(user && user.id === card.user_id);
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
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1">총 조회 {cardViewCount}</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1">클릭 수 {cardClickCount}</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1">
                          만료일 {new Date(access.expireAt).toLocaleDateString("ko-KR")}
                        </span>
                      </div>
                    </div>
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

                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
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
                      onClick={() => addPromotionLink(card)}
                    >
                      홍보 링크 추가
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

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
    </div>
  );
}
