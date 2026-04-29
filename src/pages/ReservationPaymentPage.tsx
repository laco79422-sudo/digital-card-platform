import { Button } from "@/components/ui/Button";
import { BRAND_DISPLAY_NAME } from "@/lib/brand";
import { tossConfirmPaymentUrl } from "@/lib/netlifyFunctionsUrl";
import { readTossClientKey, requestTossReservationPayment } from "@/lib/payment/tossReservation";
import {
  confirmReservationDemoPaymentRemote,
  fetchReservationForPaymentRemote,
  updateReservationPendingAmountRemote,
  type ReservationPayPayload,
} from "@/services/reservationsService";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

function formatWon(n: number): string {
  return new Intl.NumberFormat("ko-KR").format(n);
}

export function ReservationPaymentPage() {
  const { reservationId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token")?.trim() ?? "";

  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<ReservationPayPayload | null>(null);
  const [amountDraft, setAmountDraft] = useState("");
  const [payBusy, setPayBusy] = useState(false);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [donePaymentId, setDonePaymentId] = useState<string | null>(null);
  const verifyStarted = useRef(false);

  const tossClientKey = readTossClientKey();

  const parsedAmount = useMemo(() => {
    const n = Number.parseInt(amountDraft.replace(/\D/g, ""), 10);
    return Number.isFinite(n) ? n : NaN;
  }, [amountDraft]);

  useEffect(() => {
    if (!reservationId.trim() || !token) {
      setLoading(false);
      setRow(null);
      setError("예약 정보가 올바르지 않습니다.");
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      const r = await fetchReservationForPaymentRemote(reservationId, token);
      if (cancelled) return;
      setRow(r);
      if (r) setAmountDraft(String(r.amount_krw));
      else setError("예약을 찾을 수 없거나 이미 처리되었습니다.");
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [reservationId, token]);

  useEffect(() => {
    const paymentKey = searchParams.get("paymentKey")?.trim();
    const orderId = searchParams.get("orderId")?.trim();
    const amountStr = searchParams.get("amount")?.trim();
    if (!paymentKey || !orderId || !amountStr || !row || !token.trim()) return;
    if (donePaymentId) return;
    if (verifyStarted.current) return;
    verifyStarted.current = true;
    let cancelled = false;
    void (async () => {
      setVerifyBusy(true);
      setError(null);
      try {
        const amountNum = Number.parseInt(amountStr, 10);
        const res = await fetch(tossConfirmPaymentUrl(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: amountNum,
            reservationId,
            bookingToken: token,
          }),
        });
        const payload = (await res.json()) as { ok?: boolean; paymentId?: string; error?: string };
        if (cancelled) return;
        if (!res.ok || !payload.ok || !payload.paymentId) {
          setError(payload.error ?? "결제 검증에 실패했습니다.");
          verifyStarted.current = false;
          return;
        }
        setDonePaymentId(String(payload.paymentId));
      } catch {
        if (!cancelled) {
          setError("결제 검증 요청에 실패했습니다.");
          verifyStarted.current = false;
        }
      } finally {
        if (!cancelled) setVerifyBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, row, token, reservationId, donePaymentId]);

  const payDemo = useCallback(async () => {
    if (!row || !token) return;
    setError(null);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      setError("결제 금액을 확인해 주세요.");
      return;
    }
    setPayBusy(true);
    if (parsedAmount !== row.amount_krw) {
      const ok = await updateReservationPendingAmountRemote(reservationId, token, parsedAmount);
      if (!ok) {
        setPayBusy(false);
        setError("금액을 저장하지 못했습니다.");
        return;
      }
    }
    const payId = await confirmReservationDemoPaymentRemote(reservationId, token);
    setPayBusy(false);
    if (!payId) {
      setError("결제를 완료하지 못했습니다. 다시 시도해 주세요.");
      return;
    }
    setDonePaymentId(payId);
  }, [row, token, parsedAmount, reservationId]);

  const payWithToss = useCallback(async () => {
    if (!row || !token || !tossClientKey) return;
    setError(null);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      setError("결제 금액을 확인해 주세요.");
      return;
    }
    setPayBusy(true);
    if (parsedAmount !== row.amount_krw) {
      const ok = await updateReservationPendingAmountRemote(reservationId, token, parsedAmount);
      if (!ok) {
        setPayBusy(false);
        setError("금액을 저장하지 못했습니다.");
        return;
      }
    }
    setPayBusy(false);
    const base =
      typeof window !== "undefined"
        ? `${window.location.origin}/pay/reservation/${encodeURIComponent(reservationId)}`
        : "";
    const successUrl = `${base}?${new URLSearchParams({ token }).toString()}`;
    const failUrl = `${base}?${new URLSearchParams({ token, fail: "1" }).toString()}`;
    try {
      await requestTossReservationPayment({
        clientKey: tossClientKey,
        reservationId,
        bookingToken: token,
        amountKrw: parsedAmount,
        orderName: `예약 결제 · ${row.service_name || "예약"}`,
        successUrl,
        failUrl,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "결제창을 열 수 없습니다.");
    }
  }, [row, token, tossClientKey, parsedAmount, reservationId]);

  const pay = useCallback(async () => {
    if (tossClientKey) await payWithToss();
    else await payDemo();
  }, [tossClientKey, payWithToss, payDemo]);

  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-5">
        <Loader2 className="h-10 w-10 animate-spin text-brand-600" aria-hidden />
        <p className="mt-4 text-base font-medium text-slate-600">예약 정보를 불러오는 중입니다.</p>
      </div>
    );
  }

  if (!loading && !row) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-5">
        <p className="text-center text-lg font-semibold text-slate-900">{error ?? "예약을 찾을 수 없습니다."}</p>
        <button
          type="button"
          className="mt-8 text-base font-semibold text-brand-700 underline-offset-2 hover:underline"
          onClick={() => navigate(-1)}
        >
          이전으로
        </button>
        <Link to="/" className="mt-4 text-sm text-slate-500 hover:text-brand-700">
          홈으로
        </Link>
      </div>
    );
  }

  if (donePaymentId && row) {
    return (
      <div className="min-h-dvh bg-gradient-to-b from-brand-50 to-slate-50 px-5 py-12">
        <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
          <div className="flex flex-col items-center text-center">
            <CheckCircle2 className="h-14 w-14 text-emerald-600" aria-hidden />
            <h1 className="mt-4 text-2xl font-extrabold text-slate-900">결제가 완료되었습니다</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              예약이 확정되었습니다. 업체에서 연락드릴 수 있어요.
            </p>
            <dl className="mt-6 w-full rounded-xl bg-slate-50 px-4 py-3 text-left text-sm">
              <div className="flex justify-between gap-4 py-1">
                <dt className="text-slate-500">예약일</dt>
                <dd className="font-semibold text-slate-900">{row.reservation_date}</dd>
              </div>
              <div className="flex justify-between gap-4 py-1">
                <dt className="text-slate-500">시간</dt>
                <dd className="font-semibold text-slate-900">{row.time_slot}</dd>
              </div>
              <div className="flex justify-between gap-4 py-1">
                <dt className="text-slate-500">서비스</dt>
                <dd className="font-semibold text-slate-900">{row.service_name}</dd>
              </div>
            </dl>
            <Link
              to="/"
              className="mt-8 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-bold text-white hover:bg-slate-800"
            >
              {BRAND_DISPLAY_NAME} 홈
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!row) {
    return null;
  }

  const payFail = searchParams.get("fail") === "1";

  return (
    <div className="min-h-dvh bg-gradient-to-b from-slate-100 to-white px-5 py-10 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-md">
        <p className="text-center text-xs font-bold uppercase tracking-wide text-slate-500">결제</p>
        <h1 className="mt-2 text-center text-2xl font-extrabold text-slate-900">예약 결제</h1>
        <p className="mt-2 text-center text-sm leading-relaxed text-slate-600">
          {tossClientKey
            ? "토스페이먼츠로 안전하게 결제합니다. 성공 후 서버에서 결제를 검증합니다."
            : "데모 연결 — 운영에서는 토스 클라이언트 키를 설정해 주세요."}
        </p>

        {payFail ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-sm font-medium text-red-800">
            결제가 취소되었거나 실패했습니다. 다시 시도해 주세요.
          </p>
        ) : null}

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">예약자</dt>
              <dd className="text-right font-semibold text-slate-900">{row.customer_name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">연락처</dt>
              <dd className="text-right font-semibold text-slate-900">{row.phone}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">일정</dt>
              <dd className="text-right font-semibold text-slate-900">
                {row.reservation_date} {row.time_slot}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">서비스</dt>
              <dd className="text-right font-semibold text-slate-900">{row.service_name}</dd>
            </div>
          </dl>

          <label className="mt-6 block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">결제 금액 (원)</span>
            <input
              type="text"
              inputMode="numeric"
              value={amountDraft}
              onChange={(e) => setAmountDraft(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-lg font-bold text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25"
            />
            <span className="mt-1 block text-xs text-slate-500">
              업종별 기본 금액이 채워져 있습니다. 필요하면 수정할 수 있어요.
            </span>
          </label>

          <p className="mt-4 text-center text-lg font-extrabold text-brand-900">
            ₩{Number.isFinite(parsedAmount) ? formatWon(parsedAmount) : "—"}
          </p>

          {error ? (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
              {error}
            </p>
          ) : null}

          <Button
            type="button"
            className="mt-6 min-h-[52px] w-full text-base font-bold"
            disabled={payBusy || verifyBusy}
            onClick={() => void pay()}
          >
            {verifyBusy ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden />
                결제 검증 중…
              </>
            ) : payBusy ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden />
                처리 중…
              </>
            ) : tossClientKey ? (
              "토스로 결제하기"
            ) : (
              "결제 완료하기 (데모)"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
