import { useAuthStore } from "@/stores/authStore";
import type { UserRole } from "@/types/domain";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

export function ProtectedRoute({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: UserRole[];
}) {
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.authLoading);
  const location = useLocation();

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

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
