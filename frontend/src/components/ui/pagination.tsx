"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";

export function Pagination({
  page,
  pageCount,
  prevHref,
  nextHref,
}: {
  page: number;
  pageCount: number;
  prevHref: ComponentProps<typeof Link>["href"];
  nextHref: ComponentProps<typeof Link>["href"];
}) {
  const { t } = useLocale();

  if (pageCount <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-3xl border border-white/70 bg-white/70 px-4 py-3">
      <p className="text-sm text-slate-500">
        {t("Page {page} of {pageCount}", { page, pageCount })}
      </p>
      <div className="flex items-center gap-2">
        <Button asChild variant="secondary" size="sm" disabled={page <= 1}>
          <Link aria-disabled={page <= 1} href={prevHref}>
            <ChevronLeft className="h-4 w-4" />
            {t("Previous")}
          </Link>
        </Button>
        <Button asChild variant="secondary" size="sm" disabled={page >= pageCount}>
          <Link aria-disabled={page >= pageCount} href={nextHref}>
            {t("Next")}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
