"use client";

import { Toaster } from "sonner";
import { useTheme } from "@/components/providers/theme-provider";

export function AppToaster() {
  const { theme } = useTheme();

  return (
    <Toaster
      theme={theme}
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "!rounded-3xl !border !border-[var(--ui-border)] !bg-[var(--ui-surface-solid)] !text-[var(--ui-text-strong)] !shadow-[var(--ui-shadow-strong)]",
        },
      }}
    />
  );
}
