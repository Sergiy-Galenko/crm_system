import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-28 w-full rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] px-3.5 py-3 text-sm text-[var(--ui-text-strong)] outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-[background-color,border-color,color,box-shadow] focus:border-[var(--ui-border-strong)] focus:ring-2 focus:ring-[var(--ui-ring)]",
        className,
      )}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";
