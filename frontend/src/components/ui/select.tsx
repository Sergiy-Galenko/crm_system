import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "h-11 w-full appearance-none rounded-xl border border-[var(--ui-field-border)] bg-[var(--ui-field-bg)] px-3.5 pr-10 text-sm text-[var(--ui-text-strong)] outline-none shadow-[var(--ui-field-shadow)] transition-[background-color,border-color,color,box-shadow] hover:border-[var(--ui-field-border-strong)] hover:bg-[var(--ui-field-bg-hover)] focus:border-[var(--ui-field-border-strong)] focus:bg-[var(--ui-field-bg-hover)] focus:ring-2 focus:ring-[var(--ui-ring)]",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ui-text-soft)]" />
    </div>
  );
});

Select.displayName = "Select";
