import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  claimAdClickReward,
  fetchPublicRewardAds,
  fetchUserAdRewardBalance,
  recordAdView,
  type PublicRewardAd,
} from "@/services/rewardAdsService";
import { useAuthStore } from "@/stores/authStore";
import { Gift, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

const SECTION_COPY = {
  description:
    "광고를 확인하면 홍보 포인트를 받을 수 있습니다. 적립된 포인트는 명함 홍보와 추가 기능에 사용할 수 있어요.",
  button: "광고 보고 포인트 받기",
  success: "포인트가 적립되었습니다.",
  pointsUsage: [
    "홍보 링크 추가 할인",
    "명함 추가 할인",
    "광고 노출 구매",
    "제작 의뢰 할인",
  ] as const,
};

function placementHeading(placement: "landing" | "dashboard" | "card_complete"): string {
  if (placement === "landing") return "추천 광고";
  if (placement === "dashboard") return "리워드 광고 보고 포인트 받기";
  return "광고 보고 홍보 포인트 받기";
}

function AdCard({
  ad,
  loggedIn,
  onBusy,
  busyId,
  onResult,
}: {
  ad: PublicRewardAd;
  loggedIn: boolean;
  onBusy: (id: string | null) => void;
  busyId: string | null;
  onResult: (msg: string, ok: boolean) => void;
}) {
  const busy = busyId === ad.id;

  useEffect(() => {
    void recordAdView(ad.id);
  }, [ad.id]);

  const handleClick = async () => {
    if (!loggedIn) {
      onResult("로그인 후 포인트를 받을 수 있어요.", false);
      return;
    }
    onBusy(ad.id);
    try {
      const r = await claimAdClickReward(ad.id);
      if (r.ok) {
        const url = r.targetUrl?.trim();
        if (url) {
          try {
            const u = new URL(url);
            if (u.protocol === "http:" || u.protocol === "https:") window.open(url, "_blank", "noopener,noreferrer");
          } catch {
            /* ignore invalid */
          }
        }
        onResult(SECTION_COPY.success, true);
      } else {
        onResult(r.message, false);
      }
    } finally {
      onBusy(null);
    }
  };

  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm",
        "ring-1 ring-slate-900/[0.04]",
      )}
    >
      <div className="aspect-[16/9] w-full bg-slate-100">
        {ad.image_url ? (
          <img
            src={ad.image_url}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-medium text-slate-400">
            이미지 없음
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-base font-bold leading-snug text-slate-900">{ad.title}</h3>
        {ad.description ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">{ad.description}</p>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          className="mt-auto min-h-11 w-full gap-2 font-bold"
          disabled={busy}
          onClick={() => void handleClick()}
        >
          {busy ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden /> : <Gift className="h-4 w-4 shrink-0" aria-hidden />}
          {SECTION_COPY.button}
        </Button>
      </div>
    </article>
  );
}

export function RewardAdsSection({
  placement,
  className,
}: {
  placement: "landing" | "dashboard" | "card_complete";
  className?: string;
}) {
  const user = useAuthStore((s) => s.user);
  const [ads, setAds] = useState<PublicRewardAd[]>([]);
  const [loadingAds, setLoadingAds] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; ok: boolean } | null>(null);
  const [points, setPoints] = useState<number | null>(null);

  const loggedIn = Boolean(user?.id);

  const refreshPoints = useCallback(async () => {
    if (!user?.id) {
      setPoints(null);
      return;
    }
    const bal = await fetchUserAdRewardBalance(user.id);
    setPoints(bal);
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isSupabaseConfigured) {
        setLoadingAds(false);
        return;
      }
      setLoadingAds(true);
      const { ads: rows } = await fetchPublicRewardAds();
      if (cancelled) return;
      setAds(rows);
      setLoadingAds(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void refreshPoints();
  }, [refreshPoints]);

  useEffect(() => {
    if (!toast?.message) return;
    const t = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const onResult = useCallback(
    (msg: string, ok: boolean) => {
      if (msg) setToast({ message: msg, ok });
      if (ok && msg === SECTION_COPY.success) void refreshPoints();
    },
    [refreshPoints],
  );

  if (!isSupabaseConfigured) return null;

  return (
    <section
      className={cn(
        placement === "landing"
          ? "border-b border-slate-200 bg-gradient-to-b from-slate-50/90 to-white"
          : "rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5",
        className,
      )}
      aria-labelledby={`reward-ads-heading-${placement}`}
    >
      <div className={placement === "landing" ? "mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8" : "p-5 sm:p-7"}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2
              id={`reward-ads-heading-${placement}`}
              className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl"
            >
              {placementHeading(placement)}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
              {SECTION_COPY.description}
            </p>
            {loggedIn && points !== null ? (
              <p className="mt-2 text-sm font-semibold text-brand-800">
                내 홍보 포인트(광고 리워드): {points.toLocaleString("ko-KR")} P
              </p>
            ) : null}
            {!loggedIn ? (
              <p className="mt-2 text-sm text-slate-600">
                <Link to="/login" className="font-semibold text-brand-800 underline-offset-4 hover:underline">
                  로그인
                </Link>
                후 버튼을 누르면 포인트가 적립됩니다.
              </p>
            ) : null}
          </div>
        </div>

        <ul className="mt-2 list-inside list-disc text-xs text-slate-500">
          {SECTION_COPY.pointsUsage.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>

        {loadingAds ? (
          <div className="mt-8 flex justify-center py-6 text-slate-500" aria-busy="true" aria-live="polite">
            <Loader2 className="h-7 w-7 animate-spin" aria-hidden />
          </div>
        ) : ads.length === 0 ? (
          <p className="mt-8 rounded-xl border border-slate-100 bg-slate-50/90 px-4 py-6 text-center text-sm font-medium text-slate-600">
            광고 준비중입니다
          </p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ads.map((ad) => (
              <AdCard
                key={ad.id}
                ad={ad}
                loggedIn={loggedIn}
                busyId={busyId}
                onBusy={setBusyId}
                onResult={onResult}
              />
            ))}
          </div>
        )}

        {toast ? (
          <p
            role="status"
            className={cn(
              "mt-6 rounded-xl border px-4 py-3 text-sm font-semibold",
              toast.ok ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-amber-200 bg-amber-50 text-amber-950",
            )}
          >
            {toast.message}
          </p>
        ) : null}

        <p className="mt-4 text-[11px] leading-relaxed text-slate-400">
          동일 광고는 참여자당 하루 1회 포인트가 적립됩니다. 비정상 이용은 제한될 수 있어요.
        </p>
      </div>
    </section>
  );
}
