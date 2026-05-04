import { helperPromoChannelLabel } from "@/lib/helperCampaignPartnerUrls";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import {
  buildHelperCampaignStatsComputed,
  fetchApplicationsForCampaign,
  fetchCardEventsLeanForCampaign,
  fetchConsultationsAggregatesForCampaign,
  fetchHelperCampaignByIdForOwner,
  fetchHelperPartnersByIds,
  fetchShareLinksForCampaign,
} from "@/services/helperCampaignPartnerService";
import { useAuthStore } from "@/stores/authStore";
import type { HelperCampaignStatsComputed } from "@/types/helperCampaignPartner";
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

export function HelperCampaignStatsPage() {
  const { campaignId = "" } = useParams<{ campaignId: string }>();
  const user = useAuthStore((s) => s.user);

  const [busy, setBusy] = useState(true);
  const [campaignTitle, setCampaignTitle] = useState("");
  const [campaignStatus, setCampaignStatus] = useState("");
  const [stats, setStats] = useState<HelperCampaignStatsComputed | null>(null);
  const [applicationsCount, setApplicationsCount] = useState(0);

  const load = useCallback(async () => {
    const uid = user?.id?.trim();
    const cid = campaignId.trim();
    if (!uid || !cid) {
      setStats(null);
      setBusy(false);
      return;
    }
    setBusy(true);
    try {
      const cm = await fetchHelperCampaignByIdForOwner(cid, uid);
      if (!cm) {
        setStats(null);
        setCampaignTitle("");
        setCampaignStatus("");
        return;
      }
      setCampaignTitle(cm.title?.trim() || "고객 유입 캠페인");
      setCampaignStatus(cm.status);

      const [events, links, consult, apps] = await Promise.all([
        fetchCardEventsLeanForCampaign(cid),
        fetchShareLinksForCampaign(cid),
        fetchConsultationsAggregatesForCampaign(cid),
        fetchApplicationsForCampaign(cid),
      ]);
      setApplicationsCount(apps.length);
      const pids = [...new Set(apps.map((a) => a.partner_id))];
      const partners = await fetchHelperPartnersByIds(pids);
      const partnersById = Object.fromEntries(partners.map((p) => [p.id, p]));

      const computed = buildHelperCampaignStatsComputed({
        events,
        shareLinks: links,
        consultationTotal: consult.total,
        consultationByPartnerId: consult.byPartnerId,
        applications: apps,
        partnersById,
      });
      setStats(computed);
    } finally {
      setBusy(false);
    }
  }, [campaignId, user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!user?.id) {
    return (
      <div className={cn(layout.page, "py-12")}>
        <Link to="/login" className="text-brand-800 underline">로그인</Link>
      </div>
    );
  }

  return (
    <div className={cn(layout.page, "mx-auto max-w-4xl pb-16 pt-8")}>
      <Link to="/dashboard#dashboard-section-helper-mgmt" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand-900">
        <ArrowLeft className="h-4 w-4" aria-hidden /> 내 공간
      </Link>
      <h1 className="mt-6 text-2xl font-bold text-slate-900">고객 유입 성과 보기</h1>
      <p className="mt-2 text-sm text-slate-600">{campaignTitle}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">진행 상태: {campaignStatus || "—"}</p>

      {busy ? <p className="mt-6 text-sm text-slate-600">집계 중…</p> : null}

      {!busy && stats ? (
        <>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-500">총 방문 수</p>
              <p className="mt-2 text-2xl font-extrabold tabular-nums text-slate-900">{stats.totalViews}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-500">문의 클릭 수</p>
              <p className="mt-2 text-2xl font-extrabold tabular-nums text-slate-900">{stats.inquiryClicks}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-500">상담 신청(폼)·문의 접수 수</p>
              <p className="mt-2 text-2xl font-extrabold tabular-nums text-slate-900">
                {stats.consultationRows + stats.formSubmits}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">consultations {stats.consultationRows} + 폼 이벤트 {stats.formSubmits}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-500">선택 파트너 수</p>
              <p className="mt-2 text-2xl font-extrabold tabular-nums text-slate-900">{stats.selectedPartnerIds.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-500">지원자 수</p>
              <p className="mt-2 text-2xl font-extrabold tabular-nums text-slate-900">{applicationsCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-500">마지막 유입 시간</p>
              <p className="mt-2 text-sm font-semibold text-slate-800">
                {stats.lastEventAt ? new Date(stats.lastEventAt).toLocaleString("ko-KR") : "—"}
              </p>
            </div>
          </div>

          <section className="mt-10">
            <h2 className="text-lg font-bold text-slate-900">채널별 방문</h2>
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold text-slate-600">
                  <tr>
                    <th className="px-3 py-2">채널</th>
                    <th className="px-3 py-2">방문</th>
                    <th className="px-3 py-2">문의 클릭</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stats.byChannelKey).map(([key, row]) => (
                    <tr key={key} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-medium text-slate-800">{helperPromoChannelLabel(key)}</td>
                      <td className="px-3 py-2">{row.views}</td>
                      <td className="px-3 py-2">{row.inquiryClicks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-bold text-slate-900">파트너별</h2>
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold text-slate-600">
                  <tr>
                    <th className="px-3 py-2">이름</th>
                    <th className="px-3 py-2">방문</th>
                    <th className="px-3 py-2">문의 클릭</th>
                    <th className="px-3 py-2">상담 폼</th>
                    <th className="px-3 py-2">상담 접수(consultations)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stats.byPartnerId).map(([pid, row]) => (
                    <tr key={pid} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-medium text-slate-800">{row.name}</td>
                      <td className="px-3 py-2">{row.views}</td>
                      <td className="px-3 py-2">{row.inquiryClicks}</td>
                      <td className="px-3 py-2">{row.formSubmits}</td>
                      <td className="px-3 py-2">{row.consultations}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {Object.keys(stats.byPartnerId).length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">아직 파트너 기준 활동 데이터가 없습니다.</p>
            ) : null}
          </section>
        </>
      ) : !busy ? (
        <p className="mt-6 text-red-700">데이터를 불러오지 못했거나 권한이 없습니다.</p>
      ) : null}

      <Link
        to={`/dashboard/helper-campaigns/${encodeURIComponent(campaignId)}/applications`}
        className="mt-10 inline-flex text-sm font-bold text-brand-800 underline"
      >
        지원자 목록으로 돌아가기
      </Link>
    </div>
  );
}
