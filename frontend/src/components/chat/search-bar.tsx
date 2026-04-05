"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SearchBar({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ui-text-soft)]" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 rounded-[1.25rem] border-[color-mix(in_srgb,var(--ui-border)_72%,transparent)] bg-[color-mix(in_srgb,var(--ui-surface-solid)_62%,transparent)] pl-11 text-[15px] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl focus:border-[color-mix(in_srgb,#93c5fd_44%,var(--ui-border))] focus:bg-[color-mix(in_srgb,var(--ui-surface-solid)_78%,transparent)]"
      />
    </div>
  );
}
