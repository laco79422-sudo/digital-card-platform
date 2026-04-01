import { Button } from "@/components/ui/Button";
import { linkButtonClassName } from "@/components/ui/buttonStyles";
import { signOutApp } from "@/lib/auth/signOutApp";
import { BRAND_DISPLAY_NAME } from "@/lib/brand";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "text-sm font-medium transition-colors",
    isActive ? "text-brand-800" : "text-slate-600 hover:text-brand-900",
  );

const links = [
  { to: "/pricing", label: "이용 안내" },
  { to: "/education", label: "교육신청" },
  { to: "/creators", label: "제작자" },
  { to: "/requests", label: "의뢰하기" },
];

export function Navbar() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.authLoading);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await signOutApp();
      setOpen(false);
      navigate("/login", { replace: true });
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className={cn("flex h-14 min-h-14 items-center justify-between gap-3 sm:h-16 sm:min-h-16", layout.page)}>
        <div className="flex items-center gap-8">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-700 to-brand-900 text-sm font-bold text-white shadow-sm">
              L
            </span>
            <span className="max-w-[11rem] truncate font-semibold tracking-tight text-slate-900 sm:max-w-none sm:hidden">
              {BRAND_DISPLAY_NAME}
            </span>
            <span className="hidden truncate font-semibold tracking-tight text-slate-900 sm:inline">
              {BRAND_DISPLAY_NAME}
            </span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={navLinkClass}>
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          {authLoading ? (
            <span className="text-sm text-slate-400" aria-live="polite">
              확인 중…
            </span>
          ) : (
            <>
              {user?.role === "admin" ? (
                <Link to="/admin" className={linkButtonClassName({ variant: "ghost", size: "sm" })}>
                  관리자
                </Link>
              ) : null}
              {user ? (
                <>
                  <Link to="/dashboard" className={linkButtonClassName({ size: "sm" })}>
                    내 공간
                  </Link>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    disabled={signingOut}
                    onClick={() => void handleLogout()}
                  >
                    <LogOut className="h-4 w-4" aria-hidden />
                    로그아웃
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" className={linkButtonClassName({ variant: "ghost", size: "sm" })}>
                    로그인
                  </Link>
                  <Link to="/signup" className={linkButtonClassName({ size: "sm" })}>
                    회원가입
                  </Link>
                </>
              )}
            </>
          )}
        </div>
        <button
          type="button"
          className="inline-flex h-12 min-h-12 w-12 min-w-12 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-800 shadow-sm md:hidden"
          aria-expanded={open}
          aria-label="메뉴"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" strokeWidth={2} /> : <Menu className="h-6 w-6" strokeWidth={2} />}
        </button>
      </div>
      {open ? (
        <div className="border-t border-slate-100 bg-white px-5 py-5 md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  cn(
                    "rounded-lg px-3 py-3 text-base font-medium transition-colors",
                    isActive ? "bg-brand-50 text-brand-800" : "text-slate-700 hover:bg-slate-50",
                  )
                }
                onClick={() => setOpen(false)}
              >
                {l.label}
              </NavLink>
            ))}
            {authLoading ? (
              <p className="mt-3 text-sm text-slate-400">확인 중…</p>
            ) : (
              <>
                {user?.role === "admin" ? (
                  <Link
                    to="/admin"
                    className="rounded-lg px-3 py-3 text-base font-medium text-brand-800 hover:bg-slate-50"
                    onClick={() => setOpen(false)}
                  >
                    관리자
                  </Link>
                ) : null}
                {user ? (
                  <div className="mt-3 flex flex-col gap-0">
                    <Link
                      to="/dashboard"
                      className={linkButtonClassName({ size: "lg", className: "w-full" })}
                      onClick={() => setOpen(false)}
                    >
                      내 공간
                    </Link>
                    <div className="my-3 border-t border-slate-200" role="separator" />
                    <button
                      type="button"
                      className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl px-3 text-base font-semibold text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                      disabled={signingOut}
                      onClick={() => void handleLogout()}
                    >
                      <LogOut className="h-5 w-5 shrink-0" aria-hidden />
                      {signingOut ? "로그아웃 중…" : "로그아웃"}
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 flex flex-col gap-3">
                    <Link
                      to="/login"
                      className={linkButtonClassName({
                        variant: "secondary",
                        size: "lg",
                        className: "w-full",
                      })}
                      onClick={() => setOpen(false)}
                    >
                      로그인
                    </Link>
                    <Link
                      to="/signup"
                      className={linkButtonClassName({ size: "lg", className: "w-full" })}
                      onClick={() => setOpen(false)}
                    >
                      회원가입
                    </Link>
                  </div>
                )}
              </>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
