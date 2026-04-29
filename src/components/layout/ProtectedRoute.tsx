import { resendSignupConfirmationEmail } from "@/lib/auth/authActions";
import { useAuthStore } from "@/stores/authStore";
import type { UserRole } from "@/types/domain";
import type { ReactNode } from "react";
import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

export function ProtectedRoute({
  children,
  roles,
  requirePartner,
}: {
  children: ReactNode;
  roles?: UserRole[];
  /** 로그인 + 이메일 인증 후 `profiles.is_partner` 필요 */
  requirePartner?: boolean;
}) {
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.authLoading);
  const location = useLocation();
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  if (authLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4 py-16">
        <p className="text-sm text-slate-500">인증 정보를 확인하는 중…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!user.email_confirmed_at) {
    const resend = async () => {
      setResendMessage(null);
      setResendError(null);
      setResending(true);
      try {
        const { errorMessage } = await resendSignupConfirmationEmail(user.email);
        if (errorMessage) {
          setResendError(errorMessage);
        } else {
          setResendMessage("인증 메일을 다시 보냈습니다. 이메일함을 확인해 주세요.");
        }
      } finally {
        setResending(false);
      }
    };

    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-amber-50 px-5 py-6 text-center shadow-sm">
          <p className="text-lg font-bold text-amber-950">이메일 인증이 필요해요.</p>
          <p className="mt-2 text-sm leading-relaxed text-amber-900">
            기존에 가입하신 계정도 안전한 이용을 위해 이메일 인증을 완료해야 합니다.
          </p>
          <p className="mt-3 break-all rounded-xl bg-white/70 px-3 py-2 text-sm font-semibold text-amber-950">
            {user.email}
          </p>
          <button
            type="button"
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-cta-500 px-4 text-sm font-bold text-white shadow-sm shadow-cta-900/20 hover:bg-cta-600 disabled:cursor-not-allowed disabled:opacity-70"
            onClick={() => void resend()}
            disabled={resending}
          >
            {resending ? "인증 메일 보내는 중..." : "인증 메일 다시 보내기"}
          </button>
          <p className="mt-3 text-xs leading-relaxed text-amber-800">
            기존 계정과 명함 데이터는 그대로 유지됩니다. 인증만 완료해 주세요.
          </p>
          {resendMessage ? <p className="mt-3 text-sm font-medium text-emerald-700">{resendMessage}</p> : null}
          {resendError ? <p className="mt-3 text-sm font-medium text-red-600">{resendError}</p> : null}
        </div>
      </div>
    );
  }

  if (requirePartner && !user.is_partner) {
    return <Navigate to="/promotion/partner" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
