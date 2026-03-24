import { cn } from "@/lib/utils";

export function FormField({
  label,
  error,
  description,
  children,
  className,
}: {
  label: string;
  error?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("grid gap-2", className)}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      {description ? <span className="text-xs text-slate-400">{description}</span> : null}
      {error ? <span className="text-xs font-medium text-rose-500">{error}</span> : null}
    </label>
  );
}
