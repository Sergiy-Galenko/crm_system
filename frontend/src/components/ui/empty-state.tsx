import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="card flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-5 rounded-3xl bg-slate-100 p-4 text-slate-500">
        <Inbox className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {actionLabel && onAction ? (
        <Button className="mt-6" variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
