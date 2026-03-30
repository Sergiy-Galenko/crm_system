"use client";

import { useEffect } from "react";
import { useLocale } from "@/components/providers/locale-provider";
import { EmptyState } from "@/components/ui/empty-state";

export default function TasksError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLocale();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      title={t("Task Manager is temporarily unavailable.")}
      description={t("Reload this section to try fetching tasks again.")}
      actionLabel={t("Try again")}
      onAction={reset}
    />
  );
}
