import Link from "next/link";
import { fromNow } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/avatar";

export function ActivityFeed({
  items,
}: {
  items: Array<{
    id: string;
    description: string;
    createdAt: Date;
    actor?: {
      name: string;
      avatarColor: string;
    } | null;
  }>;
}) {
  return (
    <div className="card rounded-[2rem] p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">Recent activity</h3>
          <p className="mt-1 text-sm text-slate-500">The latest sales, promo, and account updates.</p>
        </div>
        <Link href="/dashboard/analytics" className="text-sm font-medium text-slate-500 transition hover:text-slate-950">
          View analytics
        </Link>
      </div>
      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-4 rounded-2xl border border-white/70 bg-white/70 p-4">
            <UserAvatar
              name={item.actor?.name ?? "System"}
              color={item.actor?.avatarColor ?? "#0F1728"}
              className="h-11 w-11"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-6 text-slate-700">{item.description}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">{fromNow(item.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
