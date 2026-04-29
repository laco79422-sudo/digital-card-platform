import { Button } from "@/components/ui/Button";
import { getStoredPartnerForCard } from "@/lib/linkoPartnerAttribution";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { insertReservationRemote } from "@/services/reservationsService";
import type { BusinessCard } from "@/types/domain";
import { CalendarClock, ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const TIME_SLOTS = (() => {
  const out: string[] = [];
  for (let h = 9; h <= 18; h++) {
    for (const m of [0, 30]) {
      if (h === 18 && m > 0) break;
      out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return out;
})();

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toYmd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseYmd(s: string): Date {
  const [y, m, day] = s.split("-").map((x) => Number.parseInt(x, 10));
  return new Date(y, (m || 1) - 1, day || 1);
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, delta: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

function daysForMonthGrid(viewMonth: Date): { date: Date; inMonth: boolean }[] {
  const first = startOfMonth(viewMonth);
  const lastDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const startWeekday = first.getDay();
  const grid: { date: Date; inMonth: boolean }[] = [];
  const prevMonthLast = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 0).getDate();
  for (let i = 0; i < startWeekday; i++) {
    const day = prevMonthLast - startWeekday + i + 1;
    grid.push({ date: new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, day), inMonth: false });
  }
  for (let day = 1; day <= lastDay; day++) {
    grid.push({ date: new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day), inMonth: true });
  }
  while (grid.length % 7 !== 0 || grid.length < 42) {
    const last = grid[grid.length - 1].date;
    const next = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
    grid.push({ date: next, inMonth: false });
  }
  return grid.slice(0, 42);
}

type Props = {
  open: boolean;
  onClose: () => void;
  card: BusinessCard;
  defaultAmountKrw: number;
  serviceTitles: string[];
  onReserved: (payload: { id: string; booking_token: string }) => void;
};

export function ReservationModal({
  open,
  onClose,
  card,
  defaultAmountKrw,
  serviceTitles,
  onReserved,
}: Props) {
  const todayStr = useMemo(() => {
    const d = new Date();
    return toYmd(d);
  }, []);

  const [date, setDate] = useState(todayStr);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0] ?? "10:00");
  const [serviceMode, setServiceMode] = useState<"pick" | "custom">(
    serviceTitles.length ? "pick" : "custom",
  );
  const [servicePick, setServicePick] = useState(serviceTitles[0] ?? "");
  const [serviceCustom, setServiceCustom] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDate(todayStr);
    setViewMonth(startOfMonth(parseYmd(todayStr)));
    setError(null);
    setBusy(false);
  }, [open, todayStr]);

  useEffect(() => {
    if (!open) return;
    if (serviceTitles.length && !serviceTitles.includes(servicePick)) {
      setServicePick(serviceTitles[0] ?? "");
    }
  }, [open, serviceTitles, servicePick]);

  useEffect(() => {
    setViewMonth(startOfMonth(parseYmd(date)));
  }, [date]);

  const serviceName =
    serviceMode === "pick"
      ? servicePick.trim()
      : serviceCustom.trim();

  const gridDays = useMemo(() => daysForMonthGrid(viewMonth), [viewMonth]);

  const submit = useCallback(async () => {
    setError(null);
    if (!isSupabaseConfigured) {
      setError("예약 저장을 위해 서버 연결(Supabase)이 필요합니다.");
      return;
    }
    if (!customerName.trim()) {
      setError("이름을 입력해 주세요.");
      return;
    }
    if (!phone.replace(/\D/g, "").trim()) {
      setError("연락처를 입력해 주세요.");
      return;
    }
    if (!serviceName) {
      setError("서비스를 선택하거나 입력해 주세요.");
      return;
    }
    setBusy(true);
    const partnerUserId = getStoredPartnerForCard(card.id);
    const row = await insertReservationRemote({
      card_id: card.id,
      customer_name: customerName.trim(),
      phone: phone.trim(),
      service_name: serviceName,
      reservation_date: date,
      time_slot: timeSlot,
      amount_krw: defaultAmountKrw,
      request_message: requestMessage.trim() || null,
      ...(partnerUserId ? { partner_user_id: partnerUserId } : {}),
    });
    setBusy(false);
    if (!row) {
      setError("예약을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    onReserved({ id: row.id, booking_token: row.booking_token });
    onClose();
  }, [
    card.id,
    customerName,
    phone,
    serviceName,
    date,
    timeSlot,
    defaultAmountKrw,
    requestMessage,
    onReserved,
    onClose,
  ]);

  if (!open) return null;

  const monthLabel = `${viewMonth.getFullYear()}년 ${viewMonth.getMonth() + 1}월`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/55 px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-10 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reservation-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          "max-h-[min(92vh,720px)] w-full max-w-md overflow-y-auto rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl",
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-brand-700" aria-hidden />
            <h2 id="reservation-modal-title" className="text-lg font-extrabold text-slate-900">
              예약하기
            </h2>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            onClick={onClose}
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">날짜</span>
            <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  className="rounded-lg p-2 text-slate-600 hover:bg-white"
                  aria-label="이전 달"
                  onClick={() => setViewMonth((m) => addMonths(m, -1))}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <p className="text-sm font-extrabold text-slate-900">{monthLabel}</p>
                <button
                  type="button"
                  className="rounded-lg p-2 text-slate-600 hover:bg-white"
                  aria-label="다음 달"
                  onClick={() => setViewMonth((m) => addMonths(m, 1))}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400">
                {["일", "월", "화", "수", "목", "금", "토"].map((w) => (
                  <div key={w} className="py-1">
                    {w}
                  </div>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {gridDays.map(({ date: cell, inMonth }, idx) => {
                  const ymd = toYmd(cell);
                  const disabled = ymd < todayStr;
                  const selected = ymd === date;
                  return (
                    <button
                      key={`cal-${idx}-${ymd}`}
                      type="button"
                      disabled={disabled || !inMonth}
                      onClick={() => {
                        if (!inMonth || disabled) return;
                        setDate(ymd);
                      }}
                      className={cn(
                        "aspect-square rounded-lg text-sm font-semibold transition",
                        !inMonth && "text-transparent",
                        inMonth && !disabled && "text-slate-800 hover:bg-brand-100",
                        disabled && inMonth && "cursor-not-allowed text-slate-300",
                        selected && inMonth && "bg-brand-600 text-white hover:bg-brand-600",
                      )}
                    >
                      {inMonth ? cell.getDate() : ""}
                    </button>
                  );
                })}
              </div>
              <label className="mt-3 flex items-center gap-2 text-xs text-slate-600">
                <span className="font-semibold">직접 입력</span>
                <input
                  type="date"
                  min={todayStr}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-200 px-2 py-1 text-sm font-medium"
                />
              </label>
            </div>
          </div>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">시간</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {TIME_SLOTS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTimeSlot(t)}
                  className={cn(
                    "min-h-[40px] rounded-xl px-3 text-sm font-semibold ring-1 transition",
                    timeSlot === t
                      ? "bg-brand-600 text-white ring-brand-600"
                      : "bg-white text-slate-800 ring-slate-200 hover:bg-slate-50",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </label>

          <div>
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">서비스</span>
            {serviceTitles.length > 0 ? (
              <div className="mt-1.5 flex gap-2">
                <button
                  type="button"
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-semibold",
                    serviceMode === "pick" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-700",
                  )}
                  onClick={() => setServiceMode("pick")}
                >
                  선택
                </button>
                <button
                  type="button"
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-semibold",
                    serviceMode === "custom" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-700",
                  )}
                  onClick={() => setServiceMode("custom")}
                >
                  직접 입력
                </button>
              </div>
            ) : null}
            {serviceMode === "pick" && serviceTitles.length > 0 ? (
              <select
                value={servicePick}
                onChange={(e) => setServicePick(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-base font-medium text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25"
              >
                {serviceTitles.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={serviceCustom}
                onChange={(e) => setServiceCustom(e.target.value)}
                placeholder="예: 기본 코스 상담"
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-base font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25"
              />
            )}
          </div>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">이름</span>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              autoComplete="name"
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-base font-medium text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">연락처</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              placeholder="010-0000-0000"
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-base font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">요청사항</span>
            <textarea
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              rows={3}
              placeholder="원하시는 내용을 적어 주세요."
              className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25"
            />
          </label>

          <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-600">
            다음 단계에서 결제 금액을 확인한 뒤 결제를 완료하면 예약이 확정됩니다.
          </p>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
              {error}
            </p>
          ) : null}

          <Button
            type="button"
            className="min-h-[52px] w-full text-base font-bold"
            disabled={busy}
            onClick={() => void submit()}
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden />
                저장 중…
              </>
            ) : (
              "예약 저장 후 결제하기"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
