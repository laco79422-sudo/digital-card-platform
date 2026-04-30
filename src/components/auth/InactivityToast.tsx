import { ACCOUNT_DELETION_NOTICE_SESSION_KEY } from "@/lib/auth/accountDeletionNotice";
import { INACTIVITY_NOTICE_SESSION_KEY } from "@/lib/auth/inactivityConstants";
import { useEffect, useState } from "react";

type Props = {
  authReady: boolean;
};

/**
 * 자동 로그아웃 직후 sessionStorage에 남긴 안내를 1회만 표시합니다.
 */
export function InactivityToast({ authReady }: Props) {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authReady) return;
    const deletionMsg = sessionStorage.getItem(ACCOUNT_DELETION_NOTICE_SESSION_KEY);
    if (deletionMsg) {
      setMessage(deletionMsg);
      sessionStorage.removeItem(ACCOUNT_DELETION_NOTICE_SESSION_KEY);
      return;
    }
    const msg = sessionStorage.getItem(INACTIVITY_NOTICE_SESSION_KEY);
    if (msg) {
      setMessage(msg);
      sessionStorage.removeItem(INACTIVITY_NOTICE_SESSION_KEY);
    }
  }, [authReady]);

  if (!message) return null;

  return (
    <div
      role="status"
      className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950 shadow-sm"
    >
      <p className="min-w-0 flex-1 leading-relaxed">{message}</p>
      <button
        type="button"
        className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100"
        onClick={() => setMessage(null)}
      >
        닫기
      </button>
    </div>
  );
}
