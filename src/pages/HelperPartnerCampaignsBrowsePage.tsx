import { linkButtonClassName } from "@/components/ui/buttonStyles";
import { Input } from "@/components/ui/Input";
import { HELPER_PROMO_CHANNELS, helperPromoChannelLabel } from "@/lib/helperCampaignPartnerUrls";
import { HELPER_LINK_PAYMENT_LEAD } from "@/lib/helperLinkPricing";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import {
  fetchCardSummariesByIds,
  fetchHelperPartnerProfileForUser,
  fetchRecruitingHelperCampaigns,
  insertPartnerCampaignApplication,
} from "@/services/helperCampaignPartnerService";
import { useAuthStore } from "@/stores/authStore";
import type { HelperCampaignRow } from "@/types/helperCampaignPartner";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export function HelperPartnerCampaignsBrowsePage() {
  const user = useAuthStore((s) => s.user);
  const [rows, setRows] = useState<HelperCampaignRow[]>([]);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [applyFor, setApplyFor] = useState<HelperCampaignRow | null>(null);
  const [pickedChannels, setPickedChannels] = useState<string[]>(["kakao"]);
  const [method, setMethod] = useState("");
  const [audience, setAudience] = useState("");
  const [period, setPeriod] = useState("");
  const [canConsult, setCanConsult] = useState(true);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [cardSummaryById, setCardSummaryById] = useState<Record<string, string>>({});
  const [cardSummariesReady, setCardSummariesReady] = useState(false);

  useEffect(() => {
    void fetchRecruitingHelperCampaigns().then(setRows);
  }, []);

  useEffect(() => {
    if (!rows.length) {
      setCardSummaryById({});
      setCardSummariesReady(false);
      return;
    }
    setCardSummariesReady(false);
    const ids = [...new Set(rows.map((r) => r.card_id))];
    void fetchCardSummariesByIds(ids).then((list) => {
      const m: Record<string, string> = {};
      for (const s of list) {
        m[s.id] = [s.label, s.industry?.trim() || null].filter(Boolean).join(" · ");
      }
      setCardSummaryById(m);
      setCardSummariesReady(true);
    });
  }, [rows]);

  useEffect(() => {
    if (!user?.id) return;
    void fetchHelperPartnerProfileForUser(user.id).then((p) => setPartnerId(p?.id ?? null));
  }, [user]);

  const toggleChannel = (id: string) =>
    setPickedChannels((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const formatCampaignChannels = (c: HelperCampaignRow): string => {
    const raw = c.target_channels;
    const arr = Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
    const parts = arr.map(helperPromoChannelLabel);
    if (arr.includes("other") && c.custom_channel_text?.trim()) {
      parts.push(`기타 상세: ${c.custom_channel_text.trim()}`);
    }
    return parts.length ? parts.join(", ") : "—";
  };

  const sendApply = async () => {
    if (!partnerId || !applyFor?.id) return;
    setBusy(true);
    try {
      const row = await insertPartnerCampaignApplication({
        campaignId: applyFor.id,
        partnerId,
        proposedChannels: pickedChannels,
        promotionMethod: method,
        targetAudience: audience,
        estimatedPeriod: period,
        canConsult: canConsult,
        proposalMessage: message,
      });
      if (!row) {
        window.alert("지원 저장에 실패했습니다.(승인된 파트너 프로필·중복 지원 확인)");
        return;
      }
      window.alert("지원이 저장되었습니다(helper_partner_applications.status = applied).");
      setApplyFor(null);
      void fetchRecruitingHelperCampaigns().then(setRows);
    } finally {
      setBusy(false);
    }
  };

  if (!user?.id) {
    return (
      <div className={cn(layout.page, "py-12")}>
        <p className="text-slate-700">로그인 후 캠페인 목록을 볼 수 있습니다.</p>
        <Link to="/login" className={cn("mt-4 inline-flex", linkButtonClassName({ size: "lg" }))}>로그인</Link>
      </div>
    );
  }

  return (
    <div className={cn(layout.page, "mx-auto max-w-3xl py-10")}>
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand-900">
        <ArrowLeft className="h-4 w-4" aria-hidden /> 내 공간
      </Link>
      <h1 className="mt-6 text-2xl font-bold text-slate-900">헬퍼링크 파트너 — 모집 중 캠페인</h1>
      <p className="mt-2 text-sm font-medium leading-relaxed text-slate-700">{HELPER_LINK_PAYMENT_LEAD}</p>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        결제자가 요청서를 제출해 모집 중(recruiting)인 캠페인만 목록에 나타납니다. 지원 후 결제자가 선택하면 전용 헬퍼링크가
        발급됩니다.
      </p>

      {!partnerId ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          먼저 헬퍼링크 파트너 신청을 완료하고(승인 대기 포함) 활동 가능 프로필이 있어야 지원 저장이 됩니다.
          <Link to="/helper-partner/register" className="mt-3 block font-bold underline">
            헬퍼링크 파트너 신청으로 이동
          </Link>
        </div>
      ) : null}

      <ul className="mt-8 space-y-4">
        {rows.map((c) => (
          <li key={c.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">캠페인</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{c.title || "헬퍼링크 캠페인"}</p>
            <p className="mt-2 text-xs font-semibold text-slate-500">홍보할 명함</p>
            <p className="mt-1 text-sm text-slate-800">
              {!cardSummariesReady
                ? "명함 정보를 불러오는 중입니다…"
                : cardSummaryById[c.card_id]?.trim() || "명함이 비공개 설정이어서 요약을 표시할 수 없습니다."}
            </p>
            <p className="mt-3 text-xs font-semibold text-slate-500">원하는 채널</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">{formatCampaignChannels(c)}</p>
            <p className="mt-2 text-xs font-semibold text-slate-500">홍보 목적 · 지역</p>
            <p className="mt-1 text-sm text-slate-700">{c.goal || "—"} · {c.region?.trim() || "—"}</p>
            <p className="mt-3 text-xs font-semibold text-slate-500">요청 문구</p>
            <p className="mt-1 line-clamp-4 text-sm leading-relaxed text-slate-700">{c.required_message?.trim() || "—"}</p>
            <button
              type="button"
              disabled={!partnerId}
              className={cn(
                "mt-3 rounded-lg px-4 py-2 text-sm font-bold text-white shadow",
                partnerId ? "bg-brand-700 hover:bg-brand-800" : "cursor-not-allowed bg-slate-400",
              )}
              onClick={() => {
                setApplyFor(c);
                setMethod("");
                setMessage("");
              }}
            >
              지원하기
            </button>
          </li>
        ))}
      </ul>

      {rows.length === 0 ? <p className="mt-6 text-center text-sm text-slate-500">현재 모집 중(recruiting) 캠페인이 없습니다.</p> : null}

      {applyFor ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/45 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">캠페인 지원</h2>
            <p className="mt-1 text-xs text-slate-600">{applyFor.title}</p>
            <fieldset disabled={busy} className="mt-4 space-y-4">
              <div>
                <p className="text-sm font-semibold">내가 홍보할 채널</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {HELPER_PROMO_CHANNELS.map((ch) => (
                    <label key={ch.id} className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs">
                      <input type="checkbox" checked={pickedChannels.includes(ch.id)} onChange={() => toggleChannel(ch.id)} />
                      {ch.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold">구체적인 홍보 방법</label>
                <textarea className="mt-2 w-full min-h-[56px] rounded-xl border px-3 py-2 text-sm" value={method} onChange={(e) => setMethod(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-semibold">예상 홍보 대상</label>
                <Input className="mt-2" value={audience} onChange={(e) => setAudience(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-semibold">예상 진행 기간</label>
                <Input className="mt-2" value={period} onChange={(e) => setPeriod(e.target.value)} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={canConsult} onChange={(e) => setCanConsult(e.target.checked)} /> 상담 가능
              </label>
              <div>
                <label className="text-sm font-semibold">전략·제안 메시지</label>
                <textarea className="mt-2 w-full min-h-[88px] rounded-xl border px-3 py-2 text-sm" value={message} onChange={(e) => setMessage(e.target.value)} />
              </div>
            </fieldset>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-xl bg-slate-100 py-2 text-sm font-bold text-slate-800"
                onClick={() => setApplyFor(null)}
              >
                취소
              </button>
              <button
                type="button"
                disabled={busy}
                className="flex-1 rounded-xl bg-brand-700 py-2 text-sm font-bold text-white"
                onClick={() => void sendApply()}
              >
                지원 저장
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
