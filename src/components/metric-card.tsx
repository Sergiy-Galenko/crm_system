import { ArrowUpRight } from "lucide-react";
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
        "card rounded-[2rem] p-5",
        tone === "brand" && "border-slate-950 bg-slate-950 text-white shadow-[0_28px_90px_rgba(15,23,40,0.28)]",
      )}
    >
      <div className="flex items-center justify-between">
        <p className={cn("text-sm text-slate-500", tone === "brand" && "text-white/60")}>{label}</p>
        <div className={cn("rounded-full p-2", tone === "brand" ? "bg-white/10" : "bg-slate-100 text-slate-500")}>
          <ArrowUpRight className="h-4 w-4" />
        </div>
      </div>
      <p className={cn("mt-6 metric-value", tone === "brand" && "text-white")}>{value}</p>
      <p className={cn("mt-2 text-sm", tone === "brand" ? "text-white/65" : "text-slate-500")}>{meta}</p>
    </div>
  );
}
