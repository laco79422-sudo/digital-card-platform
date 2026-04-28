import { useAuthReady } from "@/hooks/useAuthReady";
import { isEmailConfirmed } from "@/lib/auth/authActions";
import { supabase } from "@/lib/supabase/client";
import { mapSupabaseUser } from "@/lib/supabase/mapAuthUser";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const authReady = useAuthReady();
  const setUser = useAuthStore((s) => s.setUser);
  const setSession = useAuthStore((s) => s.setSession);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authReady || !supabase) return;
    let cancelled = false;

    void (async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (cancelled) return;
      if (error) {
        setErrorMessage("인증 정보를 확인하지 못했습니다. 다시 로그인해 주세요.");
        return;
      }
      if (!session?.user) {
        navigate("/", {
          replace: true,
          state: { loginNotice: "이메일 인증이 완료되었습니다. 로그인 후 메인화면에서 명함 만들기와 내 공간을 이용할 수 있어요." },
        });
        return;
      }

      setSession(session);
      setUser(mapSupabaseUser(session.user));
      if (isEmailConfirmed(session.user)) {
        navigate("/", {
          replace: true,
          state: { loginNotice: "로그인되었습니다. 이제 메인화면에서 명함 만들기와 내 공간을 이용할 수 있어요." },
        });
      } else {
        navigate("/", { replace: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authReady, navigate, setSession, setUser]);

  return (
    <div className={cn(layout.pageAuth, "flex min-h-[50vh] items-center justify-center py-12 sm:py-20")}>
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white px-5 py-6 text-center shadow-sm">
        <p className="text-lg font-bold text-slate-900">이메일 인증을 확인하고 있습니다.</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          잠시 후 메인화면으로 이동합니다.
        </p>
        {errorMessage ? (
          <>
            <p className="mt-4 text-sm font-medium text-red-600">{errorMessage}</p>
            <Link to="/login" className="mt-5 inline-flex text-sm font-bold text-brand-700">
              로그인으로 이동
            </Link>
          </>
        ) : null}
      </div>
    </div>
  );
}
