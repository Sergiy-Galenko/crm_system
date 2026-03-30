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
    <label className={cn("grid gap-2.5", className)}>
      <span className="text-sm font-medium text-[var(--ui-text)]">{label}</span>
      {children}
      {description ? <span className="text-xs leading-5 text-[var(--ui-text-muted)]">{description}</span> : null}
      {error ? <span className="text-xs font-medium text-rose-500">{error}</span> : null}
    </label>
  );
}
