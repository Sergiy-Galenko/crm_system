import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] px-3.5 text-sm text-[var(--ui-text-strong)] outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-[background-color,border-color,color,box-shadow] focus:border-[var(--ui-border-strong)] focus:ring-2 focus:ring-[var(--ui-ring)]",
        className,
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";
