import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-28 w-full rounded-xl border border-[var(--ui-field-border)] bg-[var(--ui-field-bg)] px-3.5 py-3 text-sm text-[var(--ui-text-strong)] outline-none shadow-[var(--ui-field-shadow)] transition-[background-color,border-color,color,box-shadow] placeholder:text-[var(--ui-text-soft)] hover:border-[var(--ui-field-border-strong)] hover:bg-[var(--ui-field-bg-hover)] focus:border-[var(--ui-field-border-strong)] focus:bg-[var(--ui-field-bg-hover)] focus:ring-2 focus:ring-[var(--ui-ring)]",
        className,
      )}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";
