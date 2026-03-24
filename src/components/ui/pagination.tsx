import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Pagination({
  page,
  pageCount,
  makeHref,
}: {
  page: number;
  pageCount: number;
  makeHref: (page: number) => string;
}) {
  if (pageCount <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-3xl border border-white/70 bg-white/70 px-4 py-3">
      <p className="text-sm text-slate-500">
        Page {page} of {pageCount}
      </p>
      <div className="flex items-center gap-2">
        <Button asChild variant="secondary" size="sm" disabled={page <= 1}>
          <Link aria-disabled={page <= 1} href={makeHref(Math.max(1, page - 1))}>
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Link>
        </Button>
        <Button asChild variant="secondary" size="sm" disabled={page >= pageCount}>
          <Link aria-disabled={page >= pageCount} href={makeHref(Math.min(pageCount, page + 1))}>
            Next
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
