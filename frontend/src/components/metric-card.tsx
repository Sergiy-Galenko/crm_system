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
  const brand = tone === "brand";

  return (
    <div
      className={cn(
        brand
          ? "rounded-2xl border border-transparent bg-[var(--ui-brand)] p-5 text-[var(--ui-brand-foreground)] shadow-[var(--ui-shadow-strong)]"
          : "card p-5",
      )}
    >
      <p className={cn("text-sm font-medium text-slate-500", brand && "text-[var(--ui-brand-foreground)] opacity-70")}>{label}</p>
      <p className={cn("mt-4 metric-value", brand && "text-[var(--ui-brand-foreground)]")}>{value}</p>
      <p className={cn("mt-2 text-sm", brand ? "text-[var(--ui-brand-foreground)] opacity-75" : "text-slate-500")}>{meta}</p>
    </div>
  );
}
