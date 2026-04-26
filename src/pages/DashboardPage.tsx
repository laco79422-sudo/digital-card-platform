import { BRAND_DISPLAY_NAME, brandCta } from "@/lib/brand";
import { shareCardLinkNativeOrder } from "@/lib/kakaoWebShare";
import { buildReferralCode } from "@/lib/referrals";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useAppDataStore } from "@/stores/appDataStore";
import type { User } from "@/types/domain";
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

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const businessCards = useAppDataStore((s) => s.businessCards);
  const cardViews = useAppDataStore((s) => s.cardViews);
  const cardClicks = useAppDataStore((s) => s.cardClicks);
  const requests = useAppDataStore((s) => s.serviceRequests);
  const applications = useAppDataStore((s) => s.applications);
  const referralRecords = useAppDataStore((s) => s.referralRecords);
  const ensureReferralRecord = useAppDataStore((s) => s.ensureReferralRecord);
  const [copyDone, setCopyDone] = useState(false);
  const [shareHint, setShareHint] = useState(false);

  const uid = user?.id ?? "";
  useEffect(() => {
    if (uid) ensureReferralRecord(uid);
  }, [ensureReferralRecord, uid]);

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
    setCopyDone(true);
    window.setTimeout(() => setCopyDone(false), 2200);
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
      setShareHint(true);
      window.setTimeout(() => setShareHint(false), 3000);
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

      {!isCreator ? (
        <section className="mt-8 rounded-2xl border border-cta-200/80 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">내 명함을 만들어 공유해 보세요</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                공개 링크와 QR로 바로 공유할 수 있는 명함을 만들 수 있어요.
              </p>
            </div>
            <Link
              to="/cards/new"
              className="inline-flex min-h-[52px] shrink-0 items-center justify-center rounded-xl bg-cta-500 px-5 text-base font-bold text-white shadow-sm shadow-cta-900/20 hover:bg-cta-600"
            >
              {brandCta.createDigitalCard}
            </Link>
          </div>
        </section>
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
              {copyDone ? "복사됐어요" : "링크 복사하기"}
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-900 hover:bg-slate-50"
              onClick={() => void shareReferralLink()}
            >
              카카오톡으로 공유하기
            </button>
          </div>
          {shareHint ? (
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
    </div>
  );
}
