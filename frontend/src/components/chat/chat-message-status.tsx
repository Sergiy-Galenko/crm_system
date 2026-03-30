"use client";

import { Check, CheckCheck } from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

export function ChatMessageStatus({
  status,
  className,
}: {
  status?: "SENT" | "DELIVERED" | "READ";
  className?: string;
}) {
  const { t } = useLocale();

  if (!status) {
    return null;
  }

  if (status === "SENT") {
    return (
      <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium text-slate-400", className)}>
        <Check className="h-3.5 w-3.5" />
        {t("Sent")}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-medium",
        status === "READ" ? "text-sky-500" : "text-slate-400",
        className,
      )}
    >
      <CheckCheck className="h-3.5 w-3.5" />
      {t(status === "READ" ? "Read" : "Delivered")}
    </span>
  );
}
