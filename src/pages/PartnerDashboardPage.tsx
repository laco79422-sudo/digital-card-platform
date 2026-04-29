import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { linkButtonClassName } from "@/components/ui/buttonStyles";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import {
  fetchPartnerDashboardSnapshotRemote,
  fetchPartnerLeaderboardRemote,
  type PartnerDashboardSnapshot,
  type PartnerLeaderboardRow,
} from "@/services/partnerProgramService";
import {
  aggregatePartnerCommissionBalances,
  confirmedPartnerCommissionsForWithdrawal,
  createPartnerCommissionWithdrawalRemote,
  fetchPartnerCommissionsForUser,
  type PartnerCommissionRow,
} from "@/services/referralRewardsService";
import { useAuthStore } from "@/stores/authStore";
import { Crown, RefreshCw, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

function maskId(id: string): string {
  const t = id.replace(/-/g, "");
  return t.length >= 8 ? `${t.slice(0, 8)}…` : id;
}

const MIN_PARTNER_WITHDRAWAL_KRW = 10000;

export function PartnerDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [snapshot, setSnapshot] = useState<PartnerDashboardSnapshot | null>(null);
  const [leaderboard, setLeaderboard] = useState<PartnerLeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commissions, setCommissions] = useState<PartnerCommissionRow[]>([]);
  const [partnerWithdrawOpen, setPartnerWithdrawOpen] = useState(false);
  const [pwBankName, setPwBankName] = useState("");
  const [pwBankAccount, setPwBankAccount] = useState("");
  const [pwHolder, setPwHolder] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwErr, setPwErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const uid = user?.id;
      const [snap, lb, commissionRows] = await Promise.all([
        fetchPartnerDashboardSnapshotRemote(),
        fetchPartnerLeaderboardRemote(40),
        uid ? fetchPartnerCommissionsForUser(uid) : Promise.resolve([] as PartnerCommissionRow[]),
      ]);
      setSnapshot(snap);
      setLeaderboard(lb);
      setCommissions(commissionRows);
      if (!snap) setError("대시보드를 불러오지 못했습니다.");
    } catch {
      setError("대시보드를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const partnerBalances = useMemo(() => aggregatePartnerCommissionBalances(commissions), [commissions]);
  const withdrawableRows = useMemo(() => confirmedPartnerCommissionsForWithdrawal(commissions), [commissions]);
  const withdrawableSum = useMemo(
    () => withdrawableRows.reduce((s, r) => s + r.partner_amount, 0),
    [withdrawableRows],
  );

  const submitPartnerWithdraw = async () => {
    if (!user?.id || withdrawableRows.length === 0) return;
    if (withdrawableSum < MIN_PARTNER_WITHDRAWAL_KRW) {
      setPwErr(`출금 가능 금액이 ${MIN_PARTNER_WITHDRAWAL_KRW.toLocaleString("ko-KR")}원 이상이어야 합니다.`);
      return;
    }
    if (!pwBankName.trim() || !pwBankAccount.trim() || !pwHolder.trim()) {
      setPwErr("계좌 정보를 모두 입력해 주세요.");
      return;
    }
    setPwBusy(true);
    setPwErr(null);
    const res = await createPartnerCommissionWithdrawalRemote({
      commissionIds: withdrawableRows.map((r) => r.id),
      bankName: pwBankName.trim(),
      bankAccount: pwBankAccount.trim(),
      accountHolder: pwHolder.trim(),
    });
    setPwBusy(false);
    if (!res.ok) {
      setPwErr(res.message ?? "신청에 실패했습니다.");
      return;
    }
    setPartnerWithdrawOpen(false);
    await load();
  };

  const promoted = snapshot?.promoted_cards ?? [];

  return (
    <div className={cn(layout.page, "py-10 sm:py-14")}>
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-800">파트너</p>
            <h1 className="mt-2 text-balance text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              홍보 성과 · 수익
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-[15px]">
              명함 소유자(크리에이터)에게는 서비스 매출이, 파트너에게는 고객 결제액의 <strong className="font-semibold text-slate-800">10%</strong>가 기록됩니다. 조회·클릭·예약이 추적됩니다.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="gap-2"
            disabled={loading}
            onClick={() => void load()}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden />
            새로고침
          </Button>
        </div>

        {error ? (
          <p className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-900">
            {error}
          </p>
        ) : null}

        {loading && !snapshot ? (
          <p className="mt-10 text-center text-sm text-slate-500">불러오는 중…</p>
        ) : (
          <>
            <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <MetricCard
                label="조회수 (방문·조회 합산)"
                value={snapshot?.total_views ?? 0}
                hint={`세부: 방문 ${snapshot?.visit_logs_count ?? 0} / 카드뷰 ${snapshot?.card_views_count ?? 0}`}
              />
              <MetricCard label="클릭수 (CTA)" value={snapshot?.click_count ?? 0} />
              <MetricCard label="예약 수" value={snapshot?.reservation_count ?? 0} />
              <MetricCard label="결제 건수 (확정)" value={snapshot?.payment_count ?? 0} />
              <MetricCard
                label="홍보 수익 누적 (원)"
                value={snapshot?.partner_revenue_krw ?? 0}
                accent
              />
            </section>

            <section className="mt-14">
              <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
                <TrendingUp className="h-5 w-5 text-brand-700" aria-hidden />
                내가 연결한 명함
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                파트너 링크로 유입이 기록된 공개 명함입니다.
              </p>
              {promoted.length === 0 ? (
                <p className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center text-sm text-slate-600">
                  아직 추적된 명함이 없습니다.{" "}
                  <Link to="/promotion/partner" className="font-semibold text-brand-800 underline-offset-2 hover:underline">
                    홍보 가이드
                  </Link>
                  에서 링크를 공유해 보세요.
                </p>
              ) : (
                <ul className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white shadow-sm">
                  {promoted.map((c) => (
                    <li key={c.id} className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{c.brand_name || "명함"}</p>
                        <p className="text-sm text-slate-600">{c.person_name || ""}</p>
                      </div>
                      <Link
                        to={`/c/${encodeURIComponent(c.slug)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-sm font-semibold text-brand-800 hover:underline"
                      >
                        /c/{c.slug}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="mt-14">
              <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
                <Crown className="h-5 w-5 text-amber-600" aria-hidden />
                파트너 랭킹 (연결 점수)
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                조회·클릭·예약·결제가 가중합되어 점수가 계산됩니다.
              </p>
              {leaderboard.length === 0 ? (
                <p className="mt-6 text-center text-sm text-slate-500">아직 순위 데이터가 없습니다.</p>
              ) : (
                <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <table className="w-full min-w-[280px] text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50/90">
                      <tr>
                        <th className="px-4 py-3 font-bold text-slate-700">순위</th>
                        <th className="px-4 py-3 font-bold text-slate-700">파트너</th>
                        <th className="px-4 py-3 font-bold text-slate-700">점수</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((row) => {
                        const mine = user?.id === row.partner_user_id;
                        return (
                          <tr
                            key={row.partner_user_id}
                            className={cn(
                              "border-b border-slate-100 last:border-0",
                              mine && "bg-brand-50/80",
                            )}
                          >
                            <td className="px-4 py-3 font-semibold text-slate-900">{row.leaderboard_rank}</td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-700">
                              {maskId(row.partner_user_id)}
                              {mine ? (
                                <span className="ml-2 rounded-full bg-brand-200/80 px-2 py-0.5 text-[10px] font-bold uppercase text-brand-950">
                                  나
                                </span>
                              ) : null}
                            </td>
                            <td className="px-4 py-3 font-semibold tabular-nums text-slate-900">
                              {row.connection_score.toLocaleString("ko-KR")}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="mt-14 rounded-2xl border border-brand-200 bg-gradient-to-b from-brand-50/40 to-white p-6 shadow-sm">
              <h2 className="text-xl font-extrabold text-slate-900">파트너 수익</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                고객 예약·결제 금액의 10%가 적립됩니다. 결제 후 14일이 지나 출금 신청 가능 상태로 바뀝니다. 출금 신청 후 관리자 확인을 거쳐 지급됩니다.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <MetricCard
                  label="적립 예정 수익"
                  value={Math.round(partnerBalances.pending)}
                  hint="정산 대기(원)"
                  accent
                />
                <MetricCard
                  label="출금 가능 수익"
                  value={Math.round(partnerBalances.confirmedAvailable)}
                  hint="신청 가능(원)"
                />
                <MetricCard
                  label="지급 완료 수익"
                  value={Math.round(partnerBalances.paid)}
                  hint="누적(원)"
                />
              </div>
              <Button
                type="button"
                className="mt-6 min-h-[48px] px-6 text-base font-bold"
                disabled={withdrawableSum < MIN_PARTNER_WITHDRAWAL_KRW}
                onClick={() => {
                  setPwErr(null);
                  setPartnerWithdrawOpen(true);
                }}
              >
                출금 신청하기
              </Button>
              {withdrawableSum < MIN_PARTNER_WITHDRAWAL_KRW ? (
                <p className="mt-2 text-xs text-slate-500">
                  출금 가능 {withdrawableSum.toLocaleString("ko-KR")}원 · 최소{" "}
                  {MIN_PARTNER_WITHDRAWAL_KRW.toLocaleString("ko-KR")}원 이상일 때 신청할 수 있어요.
                </p>
              ) : (
                <p className="mt-2 text-xs text-slate-500">
                  이번 출금 신청 금액: {withdrawableSum.toLocaleString("ko-KR")}원 ({withdrawableRows.length}건)
                </p>
              )}
            </section>

            {partnerWithdrawOpen ? (
              <div
                className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 px-4 py-10"
                role="dialog"
                aria-modal="true"
                aria-labelledby="partner-withdraw-title"
              >
                <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
                  <p id="partner-withdraw-title" className="text-lg font-extrabold text-slate-900">
                    파트너 출금 신청
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    출금 신청 후 관리자 확인을 거쳐 지급됩니다.
                  </p>
                  <div className="mt-4 space-y-3">
                    <label className="block text-sm font-semibold text-slate-800">
                      은행명
                      <Input className="mt-1" value={pwBankName} onChange={(e) => setPwBankName(e.target.value)} />
                    </label>
                    <label className="block text-sm font-semibold text-slate-800">
                      계좌번호
                      <Input className="mt-1" value={pwBankAccount} onChange={(e) => setPwBankAccount(e.target.value)} />
                    </label>
                    <label className="block text-sm font-semibold text-slate-800">
                      예금주
                      <Input className="mt-1" value={pwHolder} onChange={(e) => setPwHolder(e.target.value)} />
                    </label>
                    <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800">
                      출금 금액 {withdrawableSum.toLocaleString("ko-KR")}원
                    </p>
                  </div>
                  {pwErr ? <p className="mt-3 text-sm font-medium text-red-600">{pwErr}</p> : null}
                  <div className="mt-6 flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" className="flex-1" disabled={pwBusy} onClick={() => setPartnerWithdrawOpen(false)}>
                      취소
                    </Button>
                    <Button type="button" className="flex-1 font-bold" disabled={pwBusy} onClick={() => void submitPartnerWithdraw()}>
                      {pwBusy ? "처리 중…" : "신청하기"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-12 flex flex-wrap gap-3">
              <Link to="/promotion/partner" className={linkButtonClassName({ variant: "secondary", size: "md" })}>
                홍보 파트너 안내
              </Link>
              <Link to="/dashboard" className={linkButtonClassName({ variant: "outline", size: "md" })}>
                내 공간으로
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: number;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-5 py-4 shadow-sm",
        accent ? "border-brand-200 bg-gradient-to-br from-brand-50 to-white" : "border-slate-200 bg-white",
      )}
    >
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={cn("mt-2 text-2xl font-extrabold tabular-nums", accent ? "text-brand-900" : "text-slate-900")}>
        {typeof value === "number" ? value.toLocaleString("ko-KR") : value}
      </p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
