import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-28 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200",
        className,
      )}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";
