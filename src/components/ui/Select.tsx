import { form } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import type { SelectHTMLAttributes } from "react";

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(form.input, className)} {...props}>
      {children}
    </select>
  );
}
