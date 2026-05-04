import { linkButtonClassName } from "@/components/ui/buttonStyles";
import { layout } from "@/lib/ui-classes";
import { helperPromoChannelLabel, HELPER_PROMO_CHANNELS } from "@/lib/helperCampaignPartnerUrls";
import { cn } from "@/lib/utils";
import {
  fetchApplicationsForCampaign,
  fetchCardSummariesByIds,
  fetchHelperCampaignByIdForOwner,
  fetchHelperPartnersByIds,
  rejectPartnerApplication,
  selectPartnerApplicationAndActivate,
} from "@/services/helperCampaignPartnerService";
import { useAppDataStore } from "@/stores/appDataStore";
import { useAuthStore } from "@/stores/authStore";
import type { HelperPartnerApplicationRow, HelperPartnerRow } from "@/types/helperCampaignPartner";
import type { BusinessCard } from "@/types/domain";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

function formatChannelsJson(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string").map((x) => helperPromoChannelLabel(x));
}

export function HelperCampaignApplicationsPage() {
  const navigate = useNavigate();
  const { campaignId = "" } = useParams<{ campaignId: string }>();
  const user = useAuthStore((s) => s.user);
  const businessCards = useAppDataStore((s) => s.businessCards);

  const [busy, setBusy] = useState(false);
  const [cardLabel, setCardLabel] = useState("");
  const [apps, setApps] = useState<HelperPartnerApplicationRow[]>([]);
  const [partnerMap, setPartnerMap] = useState<Record<string, HelperPartnerRow>>({});
  const [detailId, setDetailId] = useState<string | null>(null);

  const [campaign, setCampaign] = useState<Awaited<ReturnType<typeof fetchHelperCampaignByIdForOwner>>>(null);

  const load = useCallback(async () => {
    const uid = user?.id?.trim();
    const cid = campaignId.trim();
    if (!uid || !cid) {
      setCampaign(null);
      setApps([]);
      return;
    }
    setBusy(true);
    try {
      const cm = await fetchHelperCampaignByIdForOwner(cid, uid);
      setCampaign(cm);
      if (!cm) {
        setApps([]);
        return;
      }
      const [list, summaries] = await Promise.all([
        fetchApplicationsForCampaign(cid),
        fetchCardSummariesByIds([cm.card_id]),
      ]);
      setApps(list);
      const sum = summaries[0]?.label?.trim() ?? "";
      setCardLabel(sum || cm.card_id);
      const pids = [...new Set(list.map((a) => a.partner_id))];
      const partners = await fetchHelperPartnersByIds(pids);
      setPartnerMap(Object.fromEntries(partners.map((p) => [p.id, p])));
    } finally {
      setBusy(false);
    }
  }, [campaignId, user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const cardForCampaign: BusinessCard | undefined = useMemo(
    () => businessCards.find((c) => campaign && c.id === campaign.card_id),
    [businessCards, campaign],
  );

  const recruitLabel = useMemo(() => {
    const s = campaign?.status ?? "";
    if (s === "recruiting") return "홍보 파트너 모집 중";
    if (s === "draft") return "요청서 작성 전(draft)";
    if (s === "active") return "파트너 선택 완료 · 홍보 진행 중";
    if (s === "completed") return "홍보 종료";
    return s || "—";
  }, [campaign?.status]);

  const selectPartner = async (app: HelperPartnerApplicationRow) => {
    const uid = user?.id?.trim();
    const cm = campaign;
    if (!uid || !cm) return;
    const card = cardForCampaign ?? businessCards.find((c) => c.id === cm.card_id);
    if (!card?.slug?.trim()) {
      window.alert("명함 정보를 찾지 못했거나 슬러그가 없습니다.");
      return;
    }
    if (!window.confirm("이 파트너를 선택하면 다른 지원자는 거절되고, 채널별 전용 링크가 생성됩니다. 계속할까요?")) {
      return;
    }
    setBusy(true);
    try {
      const links = await selectPartnerApplicationAndActivate({
        campaignId: cm.id,
        applicationId: app.id,
        card,
        partnerProfileId: app.partner_id,
      });
      if (!links?.length) {
        window.alert("파트너 선택·링크 생성에 실패했습니다. 테이블·RLS 마이그레이션을 확인해 주세요.");
        return;
      }
      const lines = links.map((l) => `[${helperPromoChannelLabel(l.promo_channel_key)}]\n${l.share_url}`).join("\n\n");
      window.alert(`선택이 완료되었습니다. 파트너에게 채널별 링크를 전달해 주세요.\n\n${lines}`);
      navigate(`/dashboard/helper-campaigns/${encodeURIComponent(cm.id)}/stats`, { replace: true });
    } finally {
      setBusy(false);
    }
  };

  const rejectApp = async (app: HelperPartnerApplicationRow) => {
    const uid = user?.id?.trim();
    const cm = campaign;
    if (!uid || !cm) return;
    if (!window.confirm("이 지원을 거절 상태로 변경할까요?")) return;
    setBusy(true);
    try {
      const ok = await rejectPartnerApplication({ campaignId: cm.id, applicationId: app.id, ownerUserId: uid });
      if (!ok) {
        window.alert("거절 처리에 실패했습니다.");
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (!user?.id) {
    return (
      <div className={cn(layout.page, "py-12")}>
        <Link to="/login" className={cn("inline-flex", linkButtonClassName({ size: "lg" }))}>
          로그인
        </Link>
      </div>
    );
  }

  if (!campaign && !busy) {
    return (
      <div className={cn(layout.page, "mx-auto max-w-2xl py-10")}>
        <p className="text-red-700">캠페인을 찾지 못했거나 권한이 없습니다.</p>
        <Link to="/dashboard" className="mt-4 inline-flex text-brand-800 underline">
          내 공간으로
        </Link>
      </div>
    );
  }

  const targetChannelLabels =
    campaign && Array.isArray(campaign.target_channels)
      ? formatChannelsJson(campaign.target_channels as unknown[])
      : [];

  return (
    <div className={cn(layout.page, "mx-auto max-w-3xl pb-16 pt-8")}>
      <Link to="/dashboard#dashboard-section-helper-mgmt" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand-900">
        <ArrowLeft className="h-4 w-4" aria-hidden /> 내 공간 — 고객 유입 링크 관리
      </Link>
      <h1 className="mt-6 text-2xl font-bold text-slate-900">유입 파트너 지원자 확인</h1>

      <div className="mt-6 space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase text-slate-500">캠페인 제목</p>
        <p className="text-lg font-bold text-slate-900">{campaign?.title || "고객 유입 캠페인"}</p>
        <p className="text-xs font-semibold text-slate-500">홍보할 명함</p>
        <p className="text-sm font-medium text-slate-800">{cardLabel}</p>
        <p className="text-xs font-semibold text-slate-500">원하는 채널</p>
        <p className="text-sm text-slate-700">{targetChannelLabels.length ? targetChannelLabels.join(", ") : "—"}</p>
        <p className="text-xs font-semibold text-slate-500">홍보 목적 · 지역</p>
        <p className="text-sm text-slate-700">
          {campaign?.goal || "—"} · {campaign?.region?.trim() || "—"}
        </p>
        <p className="text-xs font-semibold text-slate-500">모집 상태</p>
        <p className="text-sm font-bold text-brand-900">{recruitLabel}</p>
      </div>

      {busy ? <p className="mt-6 text-sm text-slate-600">불러오는 중…</p> : null}

      <ul className="mt-8 space-y-4">
        {apps.map((app) => {
          const hp = partnerMap[app.partner_id];
          const pname = hp?.display_name?.trim() || "파트너";
          const channels = HELPER_PROMO_CHANNELS.filter((c) =>
            Array.isArray(app.proposed_channels) ? app.proposed_channels.includes(c.id) : false,
          ).map((c) => c.label);

          const openDetail = detailId === app.id;
          const canPick = campaign?.status === "recruiting" && app.status === "applied";
          const showReject = campaign?.status === "recruiting" && app.status === "applied";

          return (
            <li key={app.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase text-slate-500">파트너</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{pname}</p>
              <p className="mt-2 text-xs text-slate-500">지원일 {new Date(app.created_at).toLocaleString("ko-KR")}</p>
              <p className="mt-2 text-sm text-slate-700">
                활동 지역: {hp?.region?.trim() || "—"}
              </p>
              <p className="mt-1 text-sm text-slate-700">제안 채널: {channels.length ? channels.join(", ") : "—"}</p>
              <p className="mt-2 text-xs font-semibold text-slate-500">제안 홍보 방법</p>
              <p className="mt-1 text-sm text-slate-800">{app.promotion_method?.trim() || "—"}</p>
              <p className="mt-2 text-xs font-semibold text-slate-500">예상 홍보 대상</p>
              <p className="mt-1 text-sm text-slate-800">{app.target_audience?.trim() || "—"}</p>
              <p className="mt-2 text-xs font-semibold text-slate-500">상담 가능</p>
              <p className="mt-1 text-sm text-slate-800">{app.can_consult ? "가능" : "불가"}</p>
              <p className="mt-2 text-xs font-semibold text-slate-500">추천 가입 성과(신청 시점)</p>
              <p className="mt-1 text-sm text-slate-800">{hp?.referrer_signup_count_at_apply ?? 0}명</p>
              <p className="mt-2 text-xs font-semibold text-slate-500">프로필·이전 활동 성과 요약</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-700">{hp?.experience?.trim() || "—"}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{hp?.strategy?.trim() || hp?.bio?.slice(0, 200) || ""}</p>

              {openDetail ? (
                <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-800">
                  <p className="font-semibold">제안 메시지</p>
                  <p className="mt-2 whitespace-pre-wrap">{app.proposal_message?.trim() || "—"}</p>
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-200"
                  onClick={() => setDetailId(openDetail ? null : app.id)}
                >
                  자세히 보기
                </button>
                {canPick ? (
                  <button
                    type="button"
                    disabled={busy}
                    className="rounded-lg bg-brand-700 px-3 py-2 text-xs font-bold text-white hover:bg-brand-800"
                    onClick={() => void selectPartner(app)}
                  >
                    파트너 선택하기
                  </button>
                ) : null}
                {showReject ? (
                  <button
                    type="button"
                    disabled={busy}
                    className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-900 ring-1 ring-red-200 hover:bg-red-100"
                    onClick={() => void rejectApp(app)}
                  >
                    거절하기
                  </button>
                ) : null}
              </div>
              <p className="mt-2 text-[11px] font-semibold text-slate-500">지원 상태: {app.status}</p>
            </li>
          );
        })}
      </ul>

      {apps.length === 0 && !busy ? (
        <p className="mt-6 text-center text-sm text-slate-500">아직 지원한 파트너가 없습니다.</p>
      ) : null}
    </div>
  );
}
