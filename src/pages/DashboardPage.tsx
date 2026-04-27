import { BRAND_DISPLAY_NAME, brandCta } from "@/lib/brand";
import { resolveBusinessCardPublicUrl } from "@/lib/cardShareUrl";
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

function cardDisplayName(card: BusinessCard): string {
  return card.person_name.trim() || card.brand_name.trim() || "이름 없는 명함";
}

function cardSubline(card: BusinessCard): string {
  return [card.job_title.trim(), card.brand_name.trim()].filter(Boolean).join(" · ") || "직업/회사명 미입력";
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const businessCards = useAppDataStore((s) => s.businessCards);
  const cardViews = useAppDataStore((s) => s.cardViews);
  const cardClicks = useAppDataStore((s) => s.cardClicks);
  const requests = useAppDataStore((s) => s.serviceRequests);
  const applications = useAppDataStore((s) => s.applications);
  const referralRecords = useAppDataStore((s) => s.referralRecords);
  const ensureReferralRecord = useAppDataStore((s) => s.ensureReferralRecord);
  const upsertBusinessCard = useAppDataStore((s) => s.upsertBusinessCard);
  const [referralCopyDone, setReferralCopyDone] = useState(false);
  const [referralShareHint, setReferralShareHint] = useState(false);
  const [cardCopyId, setCardCopyId] = useState<string | null>(null);
  const [cardShareHintId, setCardShareHintId] = useState<string | null>(null);
  const [qrCard, setQrCard] = useState<BusinessCard | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

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
  const referralLink =
    refCode && typeof window !== "undefined" ? `${window.location.origin}/signup?ref=${encodeURIComponent(refCode)}` : "";

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
    if (!referralLink) return;
    const r = await shareCardLinkNativeOrder({
      shareUrl: referralLink,
      title: "린코 디지털 명함 추천 링크",
      shortMessage: "이 링크로 가입하면 디지털 명함을 만들고 이용 혜택도 받을 수 있어요.",
      kakaoDescription: "가입하고 디지털 명함을 만들어 보세요.",
    });
    if (r === "clipboard") {
      setReferralShareHint(true);
      window.setTimeout(() => setReferralShareHint(false), 3000);
    }
  };

  const shareOrigin = typeof window !== "undefined" ? window.location.origin : "";

  const copyCardLink = async (card: BusinessCard) => {
    const url = resolveBusinessCardPublicUrl(card, shareOrigin) ?? "";
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("명함 링크를 복사해 주세요", url);
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
      shortMessage: "내 디지털 명함 페이지 링크예요.",
      kakaoDescription: card.intro.trim() || cardSubline(card),
      kakaoImageUrl: card.imageUrl?.trim() || card.brand_image_url?.trim() || undefined,
    });
    if (r === "clipboard") {
      setCardShareHintId(card.id);
      window.setTimeout(() => setCardShareHintId(null), 3000);
    }
  };

  const openQr = async (card: BusinessCard) => {
    const qrUrl = resolveBusinessCardPublicUrl(card, shareOrigin) ?? "";
    console.log("[QR URL]", qrUrl);
    console.log("[CARD SLUG]", card.slug);
    console.log("[CARD PUBLIC URL]", card.publicUrl);
    if (!qrUrl) return;
    setQrCard(card);
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

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">내 명함</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
              만든 명함을 확인하고 수정하거나 공유할 수 있어요.
            </p>
          </div>
          {!isCreator ? (
            <Link
              to="/cards/new"
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-cta-200 bg-cta-50 px-4 text-sm font-bold text-cta-700 hover:bg-cta-100"
            >
              {brandCta.createDigitalCard}
            </Link>
          ) : null}
        </div>

        {myCards.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
            <p className="text-lg font-bold text-slate-900">아직 만든 명함이 없어요.</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
              먼저 내 명함을 만들어 공유해 보세요.
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
                      </div>
                      <p className="mt-1 truncate text-sm text-slate-600">{cardSubline(card)}</p>
                      <p className="mt-2 break-all text-xs font-medium text-brand-800">{publicUrl || "/c/ 주소 미설정"}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1">총 조회 {cardViewCount}</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1">클릭 수 {cardClickCount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Link
                      to={publicUrl || `/c/${encodeURIComponent(card.slug)}`}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-900 px-3 text-sm font-bold text-white hover:bg-slate-800"
                    >
                      보기
                    </Link>
                    <Link
                      to={`/cards/${encodeURIComponent(card.id)}/edit`}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900 hover:bg-slate-50"
                    >
                      수정
                    </Link>
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
                      카카오톡 공유가 어려워 명함 링크를 복사했어요. 대화방에 붙여넣어 주세요.
                    </p>
                  ) : null}
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
                이 링크로 다른 사람이 가입하면 이용 혜택을 받을 수 있어요.
              </p>
            </div>
            <div className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200">
              추천 가입자 {referredCount}명 / 10명
            </div>
          </div>

          <div className="mt-5">
            <p className="text-sm font-semibold text-slate-800">내 추천 링크 주소</p>
            <p className="mt-2 break-all rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm font-semibold text-brand-900">
              {referralLink}
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-cta-500 px-4 text-sm font-bold text-white shadow-sm shadow-cta-900/20 hover:bg-cta-600"
              onClick={() => void copyReferralLink()}
            >
              {referralCopyDone ? "복사됐어요" : "링크 복사하기"}
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-900 hover:bg-slate-50"
              onClick={() => void shareReferralLink()}
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
              <li>10명이 가입하면 5,900원 이용권 1개월 무료</li>
              <li>20명이 가입하면 5,900원 이용권 2개월 무료</li>
            </ul>
            <p className="mt-3 text-sm font-semibold text-brand-900">
              현재 적용 가능 혜택: 5,900원 이용권 {rewardMonths}개월 무료
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
              {resolveBusinessCardPublicUrl(qrCard, shareOrigin)}
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
