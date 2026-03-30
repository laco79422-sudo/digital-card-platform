import { form } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(form.input, className)} {...props} />;
}
