import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

const variants = {
  primary:
    "bg-brand-800 text-white hover:bg-brand-900 shadow-sm shadow-brand-900/20",
  secondary: "border border-slate-300 bg-white text-brand-900 hover:bg-slate-50",
  /**
   * Solid light CTA on dark/gradient backgrounds.
   * Use this instead of primary + className text overrides — primary carries text-white and
   * without tailwind-merge caused invisible white-on-white when paired with bg-white.
   */
  solidLight:
    "border border-slate-300 bg-white text-slate-900 shadow-sm hover:bg-slate-100 active:bg-slate-200/90",
  outline: "border border-brand-700/30 text-brand-900 hover:bg-brand-50",
  /** Secondary-style CTA on dark / gradient backgrounds (white outline, light fill) */
  outlineOnDark:
    "border border-white/40 bg-white/5 text-white shadow-none backdrop-blur-sm hover:bg-white/15",
  ghost: "text-slate-700 hover:bg-slate-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
} as const;

const sizes = {
  sm: "min-h-9 h-9 px-3 text-sm rounded-xl",
  md: "min-h-11 h-11 px-4 text-sm rounded-xl",
  lg: "min-h-[52px] h-[52px] px-5 text-base font-semibold rounded-xl sm:px-6",
} as const;

type Variant = keyof typeof variants;
type Size = keyof typeof sizes;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  disabled,
  loading,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  );
}
