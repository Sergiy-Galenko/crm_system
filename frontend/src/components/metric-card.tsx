import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  meta,
  tone = "default",
}: {
  label: string;
  value: string;
  meta: string;
  tone?: "default" | "brand";
}) {
  return (
    <div
      className={cn(
        "card p-5",
        tone === "brand" && "border-transparent bg-[var(--ui-brand)] text-[var(--ui-brand-foreground)] shadow-[var(--ui-shadow-strong)]",
      )}
    >
      <p className={cn("text-sm font-medium text-slate-500", tone === "brand" && "text-[var(--ui-brand-foreground)] opacity-70")}>{label}</p>
      <p className={cn("mt-4 metric-value", tone === "brand" && "text-[var(--ui-brand-foreground)]")}>{value}</p>
      <p className={cn("mt-2 text-sm", tone === "brand" ? "text-[var(--ui-brand-foreground)] opacity-75" : "text-slate-500")}>{meta}</p>
    </div>
  );
}
