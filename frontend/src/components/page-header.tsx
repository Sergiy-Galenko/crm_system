import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div className="max-w-3xl">
        {eyebrow ? <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">{eyebrow}</p> : null}
        <h1 className="mt-2 text-[2rem] font-semibold tracking-tight text-slate-950 sm:text-[2.5rem]">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
