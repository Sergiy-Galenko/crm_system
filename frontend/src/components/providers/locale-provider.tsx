"use client";

import * as React from "react";
import { createTranslator } from "@/lib/i18n";
import type { Locale } from "@/lib/locale";

type LocaleContextValue = {
  locale: Locale;
  t: ReturnType<typeof createTranslator>;
};

const LocaleContext = React.createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const value = React.useMemo(
    () => ({
      locale,
      t: createTranslator(locale),
    }),
    [locale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = React.useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocale must be used inside LocaleProvider.");
  }

  return context;
}
