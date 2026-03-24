"use client";

import Link from "next/link";
import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

export function BrandMark({ className, href = "/" }: { className?: string; href?: string }) {
  const { t } = useLocale();

  return (
    <Link href={href} className={cn("flex items-center gap-3", className)}>
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(15,23,40,0.18)]">
        VC
      </div>
      <div>
        <p className="text-sm font-semibold tracking-[0.18em] text-slate-950">VERCEL CRM</p>
        <p className="text-xs text-slate-500">{t("Revenue operating system")}</p>
      </div>
    </Link>
  );
}
