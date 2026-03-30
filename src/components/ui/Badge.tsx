import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const tones = {
  default: "bg-slate-100 text-slate-800",
  brand: "bg-brand-100 text-brand-900",
  success: "bg-emerald-50 text-emerald-800",
  warning: "bg-amber-50 text-amber-900",
  danger: "bg-red-50 text-red-800",
} as const;

export function Badge({
  tone = "default",
  className,
  children,
}: {
  tone?: keyof typeof tones;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
