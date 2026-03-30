import { Button } from "@/components/ui/Button";
import { layout } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "text-sm font-medium transition-colors",
    isActive ? "text-brand-800" : "text-slate-600 hover:text-brand-900",
  );

const links = [
  { to: "/pricing", label: "요금제" },
  { to: "/creators", label: "제작자" },
  { to: "/requests", label: "의뢰" },
];

export function Navbar() {
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className={cn("flex h-14 min-h-14 items-center justify-between gap-3 sm:h-16 sm:min-h-16", layout.page)}>
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-900 text-sm font-bold text-white">
              BC
            </span>
            <span className="hidden font-semibold tracking-tight text-slate-900 sm:inline">
              BizCard Connect
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
          {user?.role === "admin" ? (
            <Link to="/admin">
              <Button variant="ghost" size="sm">
                관리자
              </Button>
            </Link>
          ) : null}
          {user ? (
            <Link to="/dashboard">
              <Button size="sm">대시보드</Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  로그인
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">시작하기</Button>
              </Link>
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
              <Link to="/dashboard" className="mt-3 block" onClick={() => setOpen(false)}>
                <Button className="w-full min-h-[52px]" size="lg">
                  대시보드
                </Button>
              </Link>
            ) : (
              <div className="mt-3 flex flex-col gap-3">
                <Link to="/login" onClick={() => setOpen(false)}>
                  <Button variant="secondary" className="w-full min-h-[52px]" size="lg">
                    로그인
                  </Button>
                </Link>
                <Link to="/signup" onClick={() => setOpen(false)}>
                  <Button className="w-full min-h-[52px]" size="lg">
                    시작하기
                  </Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
