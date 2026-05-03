import { linkButtonClassName } from "@/components/ui/buttonStyles";
import {
  canManagePromoHelpers,
  cardPromotionTierFromSubscriptions,
  effectiveChannelCap,
} from "@/lib/cardPromotionPlan";
import { buildPromotionCardUrl } from "@/lib/cardPromoTracking";
import { resolveBusinessCardPublicUrl } from "@/lib/cardShareUrl";
import { tryKakaoShareSendDefault } from "@/lib/kakaoWebShare";
import { canonicalSiteOrigin } from "@/lib/siteOrigin";
import { useAppDataStore } from "@/stores/appDataStore";
import { useAuthStore } from "@/stores/authStore";
import type { BusinessCard } from "@/types/domain";
import {
  PROMO_CHANNEL_OPTIONS,
  promoChannelTypeLabel,
  type CardPromoAnalyticsEventRow,
  type PromoChannelPresetId,
} from "@/types/cardPromo";
import { Copy, Share2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

function promoAgg(events: CardPromoAnalyticsEventRow[], channelId: string | null, share: "direct" | "helper") {
  const slice = events.filter((e) => e.channel_id === channelId && e.share_type === share);
  const views = slice.filter((e) => e.event_type === "view").length;
  const contacts = slice.filter((e) => e.event_type !== "view").length;
  return { views, contacts };
}

async function writeClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    window.prompt("복사해 주세요", text);
  }
}

export function CardPromotionChannelsPanel({ card }: { card: BusinessCard }) {
  const user = useAuthStore((s) => s.user);
  const subscriptions = useAppDataStore((s) => s.subscriptions);
  const channels = useAppDataStore((s) => s.cardPromotionChannels.filter((ch) => ch.card_id === card.id));
  const events = useAppDataStore((s) => s.cardPromoEvents.filter((ev) => ev.card_id === card.id));
  const addPromotionChannel = useAppDataStore((s) => s.addPromotionChannel);

  const [preset, setPreset] = useState<PromoChannelPresetId>("kakao");
  const [customLabel, setCustomLabel] = useState("");
  const [copyFlash, setCopyFlash] = useState<string | null>(null);

  const ownerUid = card.user_id;
  const mySubs = useMemo(() => subscriptions.filter((s) => s.user_id === user?.id), [subscriptions, user?.id]);

  const tier = cardPromotionTierFromSubscriptions(mySubs);

  const cap = effectiveChannelCap(tier);
  const helpersOk = canManagePromoHelpers(tier);

  const origin = typeof window !== "undefined" ? canonicalSiteOrigin() : "https://linkoapp.kr";
  const baseUrl = useMemo(
    () => resolveBusinessCardPublicUrl(card, origin) ?? `${origin.replace(/\/$/, "")}/c/${encodeURIComponent(card.slug)}`,
    [card, origin],
  );

  const directUrlFor = (cid: string) =>
    buildPromotionCardUrl({ slug: card.slug, channelId: cid, shareType: "direct", origin });

  const flushCopyHint = () => window.setTimeout(() => setCopyFlash(null), 2200);

  const onAddChannel = () => {
    if (!user?.id || user.id !== ownerUid) {
      window.alert("이 명함 소유 계정으로 로그인한 경우에만 채널을 추가할 수 있어요.");
      return;
    }
    if (tier === "free") {
      window.alert(
        "채널 추가는 유료 플랜에서 가능합니다.\n무료는 기본 링크 하나만 제공되며 전체 성과 요약 위주입니다.",
      );
      return;
    }
    if (Number.isFinite(cap) && channels.length >= cap) {
      window.alert("이 플랜에서 허용한 채널 개수에 도달했습니다. 프로에서는 무제한·헬퍼 기능을 제공합니다.");
      return;
    }

    const labelFromPreset = promoChannelTypeLabel(preset);
    const nameRaw = preset === "custom" ? customLabel.trim() : labelFromPreset;
    const name = nameRaw.trim() || labelFromPreset;

    const ok = addPromotionChannel({
      id: crypto.randomUUID(),
      user_id: ownerUid,
      card_id: card.id,
      name,
      type: preset,
      is_paid: true,
    });
    if (ok) window.alert(`「${name}」 채널이 추가되었습니다.`);
  };

  const blogTemplate = (
    slug: string,
    shareUrl: string,
  ) => `링코 디지털 명함을 소개합니다 — 아래 페이지에서 확인해 주세요.

${shareUrl}

#링코 #디지털명함 #${slug}`;

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm sm:p-5">
      <p className="text-sm font-bold text-slate-900">명함 채널 · 홍보</p>
      <p className="mt-2 text-xs leading-relaxed text-slate-600">
        홍보할 곳마다 채널을 추가하면 어디에서 고객이 들어왔는지 확인할 수 있습니다.
      </p>
      <p className="mt-1 text-xs leading-relaxed text-brand-900/85">
        혼자 홍보가 어렵다면 헬퍼를 통해 확산할 수 있습니다. (헬퍼 기능은 프로)
      </p>

      <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-600">기본 링크 · 무료</p>
        <p className="mt-1 break-all font-mono text-xs text-stone-800">{baseUrl}</p>
        <button
          type="button"
          className={linkButtonClassName({ variant: "secondary", size: "sm", className: "mt-2 gap-1.5" })}
          onClick={() =>
            void writeClipboard(baseUrl).then(() => {
              setCopyFlash("base");
              flushCopyHint();
            })
          }
        >
          <Copy className="h-3.5 w-3.5" />
          기본 링크 복사
        </button>
        {copyFlash === "base" ? <span className="ml-2 text-xs text-emerald-700">복사했습니다.</span> : null}
      </div>

      {tier === "free" ? (
        <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-950">
          채널 추가는 유료 플랜에서 시작됩니다.{" "}
          <Link className="font-semibold underline" to="/pricing">
            요금제 보기
          </Link>
        </p>
      ) : (
        <>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label className="block text-xs font-semibold text-slate-700">추가할 채널 유형</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                value={preset}
                onChange={(e) => setPreset(e.target.value as PromoChannelPresetId)}
              >
                {PROMO_CHANNEL_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
              {preset === "custom" ? (
                <input
                  type="text"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  placeholder="채널 이름"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                />
              ) : null}
            </div>
            <button type="button" className={linkButtonClassName({ size: "lg", className: "sm:shrink-0" })} onClick={onAddChannel}>
              채널 추가 (결제 필요)
            </button>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            스타터 최대 채널 {effectiveChannelCap("starter")}개 · 프로는 무제한 + 헬퍼.
          </p>
        </>
      )}

      <ul className="mt-4 space-y-3">
        {channels.map((ch) => {
          const direct = directUrlFor(ch.id);
          const dStat = promoAgg(events, ch.id, "direct");
          const hStat = promoAgg(events, ch.id, "helper");
          return (
            <li key={ch.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-sm font-bold text-slate-900">{ch.name}</span>
                <span className="text-[11px] text-slate-500">추적용 유료 채널</span>
              </div>

              <div className="mt-2 rounded-lg border border-white bg-white/80 p-2">
                <p className="text-[11px] font-semibold text-slate-800">직접 홍보</p>
                <p className="mt-0.5 break-all font-mono text-[11px] text-slate-700">{direct}</p>
                <p className="mt-1 text-[11px] text-slate-600">
                  조회 {dStat.views} · 문의/클릭 {dStat.contacts}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={linkButtonClassName({ variant: "outline", size: "sm", className: "gap-1" })}
                    onClick={() => void writeClipboard(direct)}
                  >
                    <Copy className="h-3 w-3" /> 링크 복사
                  </button>
                  {ch.type === "kakao" ? (
                    <button
                      type="button"
                      className={linkButtonClassName({ variant: "secondary", size: "sm", className: "gap-1" })}
                      onClick={() =>
                        tryKakaoShareSendDefault({
                          shareUrl: direct,
                          title: `${card.person_name || card.brand_name} · ${ch.name}`,
                          description: `명함 페이지로 바로 이동합니다.`,
                          buttonTitle: "명함 보기",
                        }) || void writeClipboard(direct).then(() => window.alert("카카오 미지원: 링크를 복사했습니다."))
                      }
                    >
                      <Share2 className="h-3 w-3" /> 홍보(카카오)
                    </button>
                  ) : null}
                  {ch.type === "blog" ? (
                    <button
                      type="button"
                      className={linkButtonClassName({ variant: "outline", size: "sm", className: "gap-1" })}
                      onClick={() => void writeClipboard(blogTemplate(card.slug, direct))}
                    >
                      블로그 템플릿 복사
                    </button>
                  ) : null}
                  {ch.type === "daangn" ? (
                    <button
                      type="button"
                      className={linkButtonClassName({ variant: "ghost", size: "sm", className: "text-xs" })}
                      onClick={() =>
                        window.alert(
                          "당근에서는 먼저 홍보 이미지를 저장한 뒤 게시글에 올리고, 본문에 위 직접 링크를 붙여 넣어 주세요.",
                        )
                      }
                    >
                      당근 안내
                    </button>
                  ) : null}
                  {ch.type === "acquaintances" || ch.type === "friend" || ch.type === "sms" ? (
                    <button
                      type="button"
                      className={linkButtonClassName({ variant: "outline", size: "sm", className: "gap-1" })}
                      onClick={() =>
                        window.open(`sms:?body=${encodeURIComponent(`명함 페이지: ${direct}`)}`, "_blank", "noopener,noreferrer")
                      }
                    >
                      문자/공유 초안 열기
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="mt-2 rounded-lg border border-slate-200 bg-slate-100/70 p-2">
                <p className="text-[11px] font-semibold text-slate-800">헬퍼 홍보</p>
                {helpersOk ? (
                  <>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                      헬퍼에게 배정되면 헬퍼마다 주소에 type=helper&amp;helper=UUID 가 붙는 링크가 발급됩니다.
                      헬퍼 배정 UI는 준비 중입니다. 아래 숫자는 헬퍼 링크로 유입된 이벤트만 분리해 보여 줍니다.
                    </p>
                    <p className="mt-2 text-[11px] text-slate-700">
                      조회 {hStat.views} · 문의/클릭 {hStat.contacts}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-[11px] text-slate-600">
                    스타터는 직접 링크만 사용 가능합니다. 프로에서 헬퍼 트래킹과 확산 기능을 제공합니다.
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
