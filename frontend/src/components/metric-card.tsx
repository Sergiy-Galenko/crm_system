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
        tone === "brand" && "border-slate-950 bg-slate-950 text-white",
      )}
    >
      <p className={cn("text-sm font-medium text-slate-500", tone === "brand" && "text-white/60")}>{label}</p>
      <p className={cn("mt-4 metric-value", tone === "brand" && "text-white")}>{value}</p>
      <p className={cn("mt-2 text-sm", tone === "brand" ? "text-white/65" : "text-slate-500")}>{meta}</p>
    </div>
  );
}
