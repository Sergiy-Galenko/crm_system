"use client";

import * as React from "react";
import {
  applyThemeToDocument,
  DEFAULT_THEME_PREFERENCE,
  getSystemTheme,
  persistThemePreference,
  readThemePreferenceFromDocument,
  readThemePreferenceFromStorage,
  resolveTheme,
  startThemeTransition,
  subscribeToSystemTheme,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/theme";

type ThemeContextValue = {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  mounted: boolean;
  setTheme: (theme: ThemePreference) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: ThemePreference;
};

export function ThemeProvider({ children, defaultTheme = DEFAULT_THEME_PREFERENCE }: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<ThemePreference>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme>(defaultTheme === "dark" ? "dark" : "light");
  const [mounted, setMounted] = React.useState(false);
  const themeRef = React.useRef(theme);

  React.useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  const syncTheme = React.useCallback(
    (nextTheme: ThemePreference, options?: { persist?: boolean; withTransition?: boolean }) => {
      const nextResolvedTheme = resolveTheme(nextTheme, getSystemTheme());

      if (options?.withTransition) {
        startThemeTransition();
      }

      applyThemeToDocument(nextTheme, nextResolvedTheme);
      setThemeState(nextTheme);
      setResolvedTheme(nextResolvedTheme);

      if (options?.persist !== false) {
        persistThemePreference(nextTheme);
      }
    },
    [],
  );

  const setTheme = React.useCallback(
    (nextTheme: ThemePreference) => {
      syncTheme(nextTheme, { withTransition: mounted });
    },
    [mounted, syncTheme],
  );

  React.useEffect(() => {
    const initialTheme = readThemePreferenceFromDocument(readThemePreferenceFromStorage(defaultTheme));
    syncTheme(initialTheme, { persist: false });
    setMounted(true);

    const unsubscribeSystemTheme = subscribeToSystemTheme(() => {
      if (themeRef.current !== "system") {
        return;
      }

      const nextResolvedTheme = resolveTheme("system", getSystemTheme());
      applyThemeToDocument("system", nextResolvedTheme);
      setResolvedTheme(nextResolvedTheme);
    });

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) {
        return;
      }

      syncTheme(readThemePreferenceFromStorage(defaultTheme), { persist: false });
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      unsubscribeSystemTheme();
      window.removeEventListener("storage", handleStorage);
    };
  }, [defaultTheme, syncTheme]);

  const value = React.useMemo(
    () => ({
      theme,
      resolvedTheme,
      mounted,
      setTheme,
    }),
    [mounted, resolvedTheme, setTheme, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = React.useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider.");
  }

  return context;
}
