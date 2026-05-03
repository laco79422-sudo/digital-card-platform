import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  cardTitle: string;
  busy: boolean;
  errorMsg: string | null;
  /** 제출 성공 시 표시되는 안내 문구 — 있으면 입력 폼 대신 결과 화면 */
  successNotice: string | null;
  onClose: () => void;
  /** 성공 확인 후 상태 초기화 + 닫기 */
  onConfirmSuccess?: () => void;
  onSubmit: (payload: { name: string; contact: string; message: string }) => void | Promise<void>;
};

export function CardConsultLeadModal({
  open,
  cardTitle,
  busy,
  errorMsg,
  successNotice,
  onClose,
  onConfirmSuccess,
  onSubmit,
}: Props) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (open && !successNotice) return;
    if (!open) {
      setName("");
      setContact("");
      setMessage("");
    }
  }, [open, successNotice]);

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  if (!open) return null;

  if (successNotice) {
    return (
      <div
        role="presentation"
        className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-3 sm:items-center"
        onClick={onClose}
        onKeyDown={onKeyDown}
      >
        <div
          role="dialog"
          aria-labelledby="consult-lead-done"
          aria-modal="true"
          className="w-full max-w-md rounded-2xl border border-emerald-200 bg-white p-5 shadow-xl sm:p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 id="consult-lead-done" className="text-lg font-extrabold text-slate-900">
            접수 완료
          </h2>
          <p className="mt-3 text-[15px] font-medium leading-relaxed text-slate-700">{successNotice}</p>
          <Button
            type="button"
            className="mt-5 min-h-11 w-full font-bold"
            onClick={() => (onConfirmSuccess ? onConfirmSuccess() : onClose())}
          >
            확인
          </Button>
        </div>
      </div>
    );
  }

  const valid = Boolean(name.trim() && contact.trim() && message.trim());

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-3 sm:items-center"
      onClick={onClose}
      onKeyDown={onKeyDown}
    >
      <div
        role="dialog"
        aria-labelledby="consult-lead-title"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="consult-lead-title" className="text-lg font-extrabold text-slate-900">
          상담 · 문의
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          「{cardTitle || "디지털 명함"}」 안내 페이지로 연결되는 문의입니다.
        </p>
        <div className="mt-4 space-y-3">
          <label className="block space-y-1">
            <span className="text-xs font-bold text-slate-600">이름</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="이름을 입력해 주세요" />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-bold text-slate-600">연락처</span>
            <Input
              type="tel"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="전화번호 또는 카카오 ID"
              autoComplete="tel"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-bold text-slate-600">문의 내용</span>
            <textarea
              rows={4}
              className="flex w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-[15px] text-slate-900 shadow-inner outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/35"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="문의 내용을 남겨 주세요."
            />
          </label>
        </div>
        {errorMsg ? (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{errorMsg}</p>
        ) : null}
        <div className="mt-5 flex gap-2">
          <Button type="button" variant="secondary" className="min-h-11 flex-1" onClick={onClose}>
            닫기
          </Button>
          <Button
            type="button"
            className="min-h-11 flex-1 font-bold"
            disabled={!valid || busy}
            onClick={() => void onSubmit({ name: name.trim(), contact: contact.trim(), message: message.trim() })}
          >
            {busy ? "전송 중..." : "보내기"}
          </Button>
        </div>
      </div>
    </div>
  );
}
