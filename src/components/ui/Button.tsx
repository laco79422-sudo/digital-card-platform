import {
  buttonBaseClassName,
  buttonSizes,
  buttonVariants,
  type ButtonSize,
  type ButtonVariant,
} from "@/components/ui/buttonStyles";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
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
        buttonBaseClassName,
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {/* 스피너를 항상 같은 위치에 두어 loading 토글 시 형제 노드 수가 바뀌지 않게 함 (insertBefore 오류 완화) */}
      <span
        aria-hidden
        className={cn(
          "inline-block h-4 w-4 shrink-0 rounded-full border-2 border-current align-middle",
          loading ? "animate-spin border-t-transparent" : "border-transparent",
        )}
      />
      <span className="inline-flex min-w-0 items-center justify-center gap-2">{children}</span>
    </button>
  );
}
