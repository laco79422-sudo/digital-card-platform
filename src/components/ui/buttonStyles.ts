import { cn } from "@/lib/utils";

/** `<button>`과 `<Link>`(앵커)가 동일한 시각 스타일을 쓰도록 공유합니다. 앵커 안에 button을 넣지 않습니다. */
export const buttonVariants = {
  primary:
    "bg-brand-800 text-white hover:bg-brand-900 shadow-sm shadow-brand-900/20",
  secondary:
    "border border-slate-300 bg-white text-brand-900 hover:bg-slate-50",
  solidLight:
    "border border-slate-300 bg-white text-slate-900 shadow-sm hover:bg-slate-100 active:bg-slate-200/90",
  outline: "border border-brand-700/30 text-brand-900 hover:bg-brand-50",
  outlineOnDark:
    "border border-white/40 bg-white/5 text-white shadow-none backdrop-blur-sm hover:bg-white/15",
  ghost: "text-slate-700 hover:bg-slate-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
} as const;

export const buttonSizes = {
  sm: "min-h-9 h-9 px-3 text-sm rounded-xl",
  md: "min-h-11 h-11 px-4 text-sm rounded-xl",
  lg: "min-h-[52px] h-[52px] px-5 text-base font-semibold rounded-xl sm:px-6",
} as const;

export type ButtonVariant = keyof typeof buttonVariants;
export type ButtonSize = keyof typeof buttonSizes;

export const buttonBaseClassName =
  "inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:pointer-events-none disabled:opacity-50";

export function linkButtonClassName({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  return cn(buttonBaseClassName, buttonVariants[variant], buttonSizes[size], className);
}
