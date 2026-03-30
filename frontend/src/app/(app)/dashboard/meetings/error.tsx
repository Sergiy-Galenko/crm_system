"use client";

import { useEffect } from "react";
import { useLocale } from "@/components/providers/locale-provider";
import { EmptyState } from "@/components/ui/empty-state";

export default function MeetingsError({
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
      title={t("Meetings are temporarily unavailable.")}
      description={t("Reload this section to try fetching the schedule again.")}
      actionLabel={t("Try again")}
      onAction={reset}
    />
  );
}
