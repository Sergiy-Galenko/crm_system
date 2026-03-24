"use client";

import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/components/providers/locale-provider";

const statusVariantMap: Record<string, "default" | "info" | "success" | "warning" | "danger"> = {
  ACTIVE: "success",
  QUALIFIED: "success",
  WON: "success",
  DONE: "success",
  SCHEDULED: "info",
  COMPLETED: "success",
  AT_RISK: "warning",
  PROPOSAL: "info",
  NEGOTIATION: "info",
  CONTACTED: "info",
  NEW: "default",
  TODO: "default",
  IN_PROGRESS: "warning",
  INACTIVE: "danger",
  LOST: "danger",
  CANCELED: "danger",
  NO_SHOW: "warning",
};

export function StatusBadge({ value, label }: { value: string; label?: string | null }) {
  const { t } = useLocale();
  const translatedValue = label ?? t(value);

  return (
    <Badge variant={statusVariantMap[value] ?? "default"}>
      {translatedValue === value ? value.replaceAll("_", " ") : translatedValue}
    </Badge>
  );
}
