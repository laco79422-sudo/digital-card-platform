import { BRAND_DISPLAY_NAME, brandCta } from "@/lib/brand";
import { signOutApp } from "@/lib/auth/signOutApp";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

/**
 * `/dashboard` 전용 최소 헤더.
 * - `<Link>` 안에 `<button>` 없음, `<button>` 안에 `<a>` 없음
 * - 햄버거·NavLink·조건부 큰 덩어리 DOM 없음 → insertBefore 유발 구조 제거
 */
export function DashboardNavbar() {
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await signOutApp();
      navigate("/login", { replace: true });
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className={cn("flex h-14 min-h-14 items-center justify-between gap-4 sm:h-16 sm:min-h-16", layout.page)}>
        <Link
          to="/"
          className="min-w-0 max-w-[min(100%,14rem)] shrink-0 truncate text-sm font-semibold text-slate-900 hover:text-brand-800 sm:max-w-xs"
        >
          {BRAND_DISPLAY_NAME}
        </Link>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            to="/cards/new"
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 sm:px-4"
          >
            {brandCta.createDigitalCard}
          </Link>
          <button
            type="button"
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 sm:px-4"
            disabled={signingOut}
            onClick={() => void handleLogout()}
          >
            {signingOut ? "로그아웃 중…" : "로그아웃"}
          </button>
        </div>
      </div>
    </header>
  );
}
