import { Button } from "@/components/ui/Button";
import { signOutApp } from "@/lib/auth/signOutApp";
import { cn } from "@/lib/utils";
import {
  checkAccountDeletionEligibility,
  deleteAccountSoft,
  type AccountDeletionEligibility,
} from "@/services/accountService";
import { useCallback, useEffect, useMemo, useState } from "react";

type Props = {
  userId: string;
  email?: string | null;
  className?: string;
};

export function AccountDeletionSection({ userId, email, className }: Props) {
  const [loading, setLoading] = useState(true);
  const [eligibility, setEligibility] = useState<AccountDeletionEligibility | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [agreePendingLoss, setAgreePendingLoss] = useState(false);
  const [agreeForfeitConfirmed, setAgreeForfeitConfirmed] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [agreeFinal, setAgreeFinal] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const e = await checkAccountDeletionEligibility({ id: userId, email });
      setEligibility(e);
      setAgreePendingLoss(false);
      setAgreeForfeitConfirmed(false);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "조회에 실패했습니다.");
      setEligibility(null);
    } finally {
      setLoading(false);
    }
  }, [userId, email]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const confirmedTotalKrw = useMemo(() => {
    if (!eligibility) return 0;
    return eligibility.referralConfirmedAvailableKrw + eligibility.partnerConfirmedAvailableKrw;
  }, [eligibility]);

  const pendingTotalKrw = useMemo(() => {
    if (!eligibility) return 0;
    return eligibility.referralPendingKrw + eligibility.partnerPendingKrw;
  }, [eligibility]);

  const canStartWithdrawalFlow = Boolean(
    eligibility?.canProceedBasics &&
      (confirmedTotalKrw === 0 || agreeForfeitConfirmed) &&
      (pendingTotalKrw === 0 || agreePendingLoss),
  );

  const openModal = () => {
    setAgreeFinal(false);
    setDeleteError(null);
    setModalOpen(true);
  };

  const submitDelete = async () => {
    if (!agreeFinal || !canStartWithdrawalFlow) return;
    setDeleteBusy(true);
    setDeleteError(null);
    const res = await deleteAccountSoft(userId, {
      reason: null,
      forfeitConfirmedRewards: confirmedTotalKrw > 0 && agreeForfeitConfirmed,
    });
    setDeleteBusy(false);
    if (!res.ok) {
      setDeleteError(res.message ?? "탈퇴 처리에 실패했습니다.");
      return;
    }
    setModalOpen(false);
    await signOutApp();
  };

  return (
    <section
      className={cn(
        "mt-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7",
        className,
      )}
      aria-labelledby="account-settings-heading"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">설정</p>
      <h2 id="account-settings-heading" className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
        계정 관리
      </h2>

      <div className="mt-6 rounded-xl border border-rose-100 bg-rose-50/50 px-4 py-4">
        <h3 className="text-base font-bold text-slate-900">회원 탈퇴</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-700">
          탈퇴하면 내 명함과 공유 링크가 중지됩니다. 추천수익, 출금 신청, 결제 내역은 정산과 확인을 위해 보관될 수
          있습니다.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          이용 중 문제가 있는 경우 먼저 문의해 주세요. 탈퇴 후에는 이용 중인 명함과 링크가 중지됩니다.
        </p>
        <ul className="mt-4 list-inside list-disc space-y-1.5 text-sm text-slate-700">
          <li>내 명함은 비공개 처리됩니다.</li>
          <li>내 명함 링크는 더 이상 열리지 않습니다.</li>
          <li>정산 대기 수익은 탈퇴 시 소멸될 수 있습니다.</li>
          <li>출금 가능 수익이 있다면 먼저 출금 신청을 완료해 주세요.</li>
          <li>탈퇴 후 복구가 어려울 수 있습니다.</li>
        </ul>

        {loading ? (
          <p className="mt-4 text-sm text-slate-500">탈퇴 조건을 확인하는 중입니다…</p>
        ) : loadError ? (
          <p className="mt-4 text-sm font-medium text-red-600">{loadError}</p>
        ) : eligibility ? (
          <div className="mt-4 space-y-3">
            {eligibility.basicBlockReasons.map((msg) => (
              <p key={msg} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                {msg}
              </p>
            ))}

            {confirmedTotalKrw > 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
                <p className="font-semibold">출금 가능한 수익이 있습니다. 먼저 출금 신청 후 탈퇴해 주세요.</p>
                <p className="mt-2 text-amber-900">
                  출금하지 않고 탈퇴하려면 아래에 동의해 주세요. (추천·파트너 출금 가능 금액 합계 약{" "}
                  {confirmedTotalKrw.toLocaleString()}원)
                </p>
                <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-slate-300"
                    checked={agreeForfeitConfirmed}
                    onChange={(e) => setAgreeForfeitConfirmed(e.target.checked)}
                  />
                  <span>출금 가능 수익을 포기하고 탈퇴합니다.</span>
                </label>
              </div>
            ) : null}

            {pendingTotalKrw > 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800">
                <p className="font-semibold">
                  정산 대기 수익은 탈퇴 시 소멸됩니다. 동의 후 탈퇴할 수 있습니다. (대기 합계 약{" "}
                  {pendingTotalKrw.toLocaleString()}원)
                </p>
                <label className="mt-3 flex cursor-pointer items-start gap-2">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-slate-300"
                    checked={agreePendingLoss}
                    onChange={(e) => setAgreePendingLoss(e.target.checked)}
                  />
                  <span>정산 대기 수익 소멸에 동의합니다.</span>
                </label>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6">
          <Button
            type="button"
            variant="outline"
            className="border-rose-200 text-rose-900 hover:bg-rose-50"
            disabled={loading || !eligibility || !eligibility.canProceedBasics || !canStartWithdrawalFlow}
            onClick={openModal}
          >
            회원 탈퇴 신청
          </Button>
        </div>
      </div>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 px-4 py-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-modal-title"
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <p id="delete-account-modal-title" className="text-lg font-bold text-slate-900">
              정말 탈퇴하시겠어요?
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              탈퇴 후 내 명함과 공유 링크는 중지됩니다.
            </p>
            <label className="mt-5 flex cursor-pointer items-start gap-2 text-sm text-slate-800">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-slate-300"
                checked={agreeFinal}
                onChange={(e) => setAgreeFinal(e.target.checked)}
              />
              <span>위 내용을 확인했고 탈퇴에 동의합니다.</span>
            </label>
            {deleteError ? <p className="mt-3 text-sm font-medium text-red-600">{deleteError}</p> : null}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-900 hover:bg-slate-50"
                onClick={() => setModalOpen(false)}
                disabled={deleteBusy}
              >
                계속 이용하기
              </button>
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-rose-600 px-4 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50"
                disabled={deleteBusy || !agreeFinal}
                onClick={() => void submitDelete()}
              >
                {deleteBusy ? "처리 중…" : "탈퇴하기"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
