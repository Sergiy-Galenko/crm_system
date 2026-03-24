import { Badge } from "@/components/ui/badge";

const statusVariantMap: Record<string, "default" | "info" | "success" | "warning" | "danger"> = {
  ACTIVE: "success",
  QUALIFIED: "success",
  WON: "success",
  DONE: "success",
  AT_RISK: "warning",
  PROPOSAL: "info",
  NEGOTIATION: "info",
  CONTACTED: "info",
  NEW: "default",
  TODO: "default",
  IN_PROGRESS: "warning",
  INACTIVE: "danger",
  LOST: "danger",
};

export function StatusBadge({ value }: { value: string }) {
  return <Badge variant={statusVariantMap[value] ?? "default"}>{value.replaceAll("_", " ")}</Badge>;
}
