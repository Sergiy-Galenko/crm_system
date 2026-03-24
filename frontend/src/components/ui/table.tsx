import { cn } from "@/lib/utils";

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn("w-full min-w-[720px] border-separate border-spacing-0", className)} {...props} />;
}

export function TableHead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("text-left", className)} {...props} />;
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn(className)} {...props} />;
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("border-b border-slate-100 last:border-none", className)} {...props} />;
}

export function TableHeaderCell({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn("px-4 pb-3 text-[12px] font-medium text-slate-500", className)}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3.5 align-top text-sm text-slate-700", className)} {...props} />;
}
