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
          toast: "!rounded-3xl !border !border-white/80 !bg-white/95 !text-slate-900 !shadow-[0_20px_70px_rgba(15,23,40,0.14)]",
        },
      }}
    />
  );
}
