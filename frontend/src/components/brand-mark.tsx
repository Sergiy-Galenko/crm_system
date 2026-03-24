"use client";

import Link from "next/link";
import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  const { t } = useLocale();

  return (
    <Link href={href as never} className={cn("flex items-center gap-3", className)}>
      <div className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-950">
        VC
      </div>
      <div>
        <p className="text-sm font-semibold tracking-[0.08em] text-slate-950">VERCEL CRM</p>
        <p className="text-xs text-slate-500">{t("Revenue operating system")}</p>
      </div>
    </Link>
  );
}
