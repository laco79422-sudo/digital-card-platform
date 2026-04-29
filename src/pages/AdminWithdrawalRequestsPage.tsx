import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import {
  adminConfirmAllPendingRewards,
  adminConfirmReferralReward,
  adminSetWithdrawalStatus,
  fetchAllWithdrawalRequestsAdmin,
  fetchPendingReferralRewardsAdmin,
  type ReferralRewardRow,
  type WithdrawalRequestRow,
} from "@/services/referralRewardsService";
import { useAppDataStore } from "@/stores/appDataStore";
import { useCallback, useEffect, useState } from "react";

const STATUS_LABEL: Record<string, string> = {
  pending: "신청 완료",
  approved: "승인",
  paid: "지급 완료",
  rejected: "거절",
};

function maskAccount(acct: string): string {
  const t = acct.replace(/\s/g, "");
  if (t.length <= 4) return t;
  return `${"*".repeat(Math.max(0, t.length - 4))}${t.slice(-4)}`;
}

export function AdminWithdrawalRequestsPage() {
  const platformUsers = useAppDataStore((s) => s.platformUsers);
  const [rows, setRows] = useState<WithdrawalRequestRow[]>([]);
  const [pendingRewards, setPendingRewards] = useState<ReferralRewardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyRewardId, setBusyRewardId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [withdrawals, pending] = await Promise.all([
      fetchAllWithdrawalRequestsAdmin(),
      fetchPendingReferralRewardsAdmin(),
    ]);
    setRows(withdrawals);
    setPendingRewards(pending);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const userLabel = (userId: string) => {
    const u = platformUsers.find((x) => x.id === userId);
    if (u?.email) return `${u.name} (${u.email})`;
    return userId.slice(0, 8) + "…";
  };

  const runStatus = async (id: string, status: "approved" | "paid" | "rejected") => {
    setBusyId(id);
    try {
      const ok = await adminSetWithdrawalStatus(id, status);
      if (ok) await load();
    } finally {
      setBusyId(null);
    }
  };

  const confirmRewardRow = async (rewardId: string) => {
    setBusyRewardId(rewardId);
    try {
      const ok = await adminConfirmReferralReward(rewardId);
      if (ok) await load();
    } finally {
      setBusyRewardId(null);
    }
  };

  const bulkConfirmRewards = async () => {
    setBulkBusy(true);
    try {
      await adminConfirmAllPendingRewards();
      await load();
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <div className={cn(layout.page, "py-10 sm:py-12")}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="break-keep text-2xl font-bold leading-snug tracking-tight text-slate-900 md:text-3xl">
            출금 신청 관리
          </h1>
          <p className="mt-1 text-base leading-relaxed text-slate-600">
            추천 보상 출금 신청을 확인하고 승인·지급·거절 처리할 수 있습니다.
          </p>
        </div>
        <Badge tone="brand">관리자</Badge>
      </div>

      <Card className="mt-8">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">정산 대기 추천 보상</h2>
            <p className="mt-1 text-sm text-slate-500">
              사용자 출금 전에 대기 보상을 정산 가능(confirmed)으로 바꿉니다.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={bulkBusy || pendingRewards.length === 0}
            onClick={() => void bulkConfirmRewards()}
          >
            {bulkBusy ? "처리 중…" : "대기 분 일괄 확정"}
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {pendingRewards.length === 0 ? (
            <p className="text-sm text-slate-500">정산 대기 보상이 없습니다.</p>
          ) : (
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="pb-2 font-medium">일시</th>
                  <th className="pb-2 font-medium">추천인</th>
                  <th className="pb-2 font-medium">결제 금액</th>
                  <th className="pb-2 font-medium">보상</th>
                  <th className="pb-2 font-medium">처리</th>
                </tr>
              </thead>
              <tbody>
                {pendingRewards.map((rw) => (
                  <tr key={rw.id} className="border-b border-slate-50 align-top">
                    <td className="py-2 text-slate-600">{new Date(rw.created_at).toLocaleString("ko-KR")}</td>
                    <td className="py-2">{userLabel(rw.referrer_user_id)}</td>
                    <td className="py-2 tabular-nums">{rw.payment_amount.toLocaleString()}원</td>
                    <td className="py-2 font-semibold tabular-nums text-brand-900">
                      {rw.reward_amount.toLocaleString()}원
                    </td>
                    <td className="py-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={busyRewardId === rw.id}
                        onClick={() => void confirmRewardRow(rw.id)}
                      >
                        확정
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900">출금 신청 목록</h2>
          <Button type="button" variant="ghost" size="sm" onClick={() => void load()} disabled={loading}>
            새로고침
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-slate-500">불러오는 중…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-slate-500">출금 신청이 없습니다.</p>
          ) : (
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500">
                  <th className="pb-2 font-medium">일시</th>
                  <th className="pb-2 font-medium">구분</th>
                  <th className="pb-2 font-medium">신청자</th>
                  <th className="pb-2 font-medium">금액</th>
                  <th className="pb-2 font-medium">은행 / 계좌</th>
                  <th className="pb-2 font-medium">예금주</th>
                  <th className="pb-2 font-medium">상태</th>
                  <th className="pb-2 font-medium">처리</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 align-top">
                    <td className="py-2 text-slate-600">{new Date(r.created_at).toLocaleString("ko-KR")}</td>
                    <td className="py-2">
                      <Badge tone={r.source_kind === "partner" ? "brand" : "default"}>
                        {r.source_kind === "partner" ? "파트너" : "추천"}
                      </Badge>
                    </td>
                    <td className="py-2 font-medium text-slate-800">{userLabel(r.user_id)}</td>
                    <td className="py-2 tabular-nums">{r.amount.toLocaleString()}원</td>
                    <td className="py-2 text-slate-700">
                      {r.bank_name}
                      <br />
                      <span className="font-mono text-xs">{maskAccount(r.bank_account)}</span>
                    </td>
                    <td className="py-2">{r.account_holder}</td>
                    <td className="py-2">{STATUS_LABEL[r.status] ?? r.status}</td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-1">
                        {r.status === "pending" ? (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={busyId === r.id}
                              onClick={() => void runStatus(r.id, "approved")}
                            >
                              승인
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled={busyId === r.id}
                              onClick={() => void runStatus(r.id, "rejected")}
                            >
                              거절
                            </Button>
                          </>
                        ) : null}
                        {r.status === "approved" ? (
                          <Button
                            type="button"
                            size="sm"
                            disabled={busyId === r.id}
                            onClick={() => void runStatus(r.id, "paid")}
                          >
                            지급 완료
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
