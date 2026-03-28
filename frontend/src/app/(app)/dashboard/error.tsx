"use client";

import { useEffect } from "react";
import { useLocale } from "@/components/providers/locale-provider";
import { EmptyState } from "@/components/ui/empty-state";

function isDatabaseUnavailableMessage(message: string) {
  return /can't reach database server|connection refused|econnrefused|localhost:5432|timed out/i.test(message);
}

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLocale();
  const isDatabaseUnavailable = isDatabaseUnavailableMessage(error.message);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      title={t(isDatabaseUnavailable ? "Database connection unavailable." : "Something went wrong.")}
      description={t(
        isDatabaseUnavailable
          ? "Start PostgreSQL on localhost:5432 and refresh the page."
          : "The dashboard hit an unexpected problem. Try reloading this section.",
      )}
      actionLabel={t("Try again")}
      onAction={reset}
    />
  );
}
