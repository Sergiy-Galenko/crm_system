"use client";

import Link from "next/link";
import { useLocale } from "@/components/providers/locale-provider";
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
  const { locale, t } = useLocale();

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{t("Recent activity")}</h3>
          <p className="mt-1 text-sm text-slate-500">{t("The latest sales, promo, and account updates.")}</p>
        </div>
        <Link href="/dashboard/analytics" className="text-sm font-medium text-slate-500 transition hover:text-slate-950">
          {t("View analytics")}
        </Link>
      </div>
      <div className="mt-6 divide-y divide-slate-100">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
            <UserAvatar
              name={item.actor?.name ?? "System"}
              color={item.actor?.avatarColor ?? "#0F1728"}
              className="h-10 w-10"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-6 text-slate-700">{item.description}</p>
              <p className="mt-1 text-xs text-slate-400">{fromNow(item.createdAt, locale)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
