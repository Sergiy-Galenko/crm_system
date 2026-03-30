"use client";

import Image from "next/image";
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
      <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] shadow-[var(--ui-shadow-xs)]">
        <Image
          src="/icon.svg"
          alt="Nexora CRM logo"
          width={40}
          height={40}
          className="h-full w-full"
          priority
        />
      </div>
      <div>
        <p className="text-sm font-semibold tracking-[0.08em] text-[var(--ui-text-strong)]">NEXORA CRM</p>
        <p className="text-xs text-[var(--ui-text-muted)]">{t("Workspace")}</p>
      </div>
    </Link>
  );
}
