"use client";

import * as React from "react";
import {
  applyAccentToDocument,
  applyThemeToDocument,
  DEFAULT_ACCENT,
  DEFAULT_THEME_PREFERENCE,
  getSystemTheme,
  persistAccentColor,
  persistThemePreference,
  readAccentFromDocument,
  readAccentFromStorage,
  readThemePreferenceFromDocument,
  readThemePreferenceFromStorage,
  resolveTheme,
  startThemeTransition,
  subscribeToSystemTheme,
  THEME_STORAGE_KEY,
  type AccentColor,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/theme";

type ThemeContextValue = {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  accent: AccentColor;
  mounted: boolean;
  setTheme: (theme: ThemePreference) => void;
  setAccent: (accent: AccentColor) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: ThemePreference;
  defaultAccent?: AccentColor;
};

export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME_PREFERENCE,
  defaultAccent = DEFAULT_ACCENT,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<ThemePreference>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme>(defaultTheme === "dark" ? "dark" : "light");
  const [accent, setAccentState] = React.useState<AccentColor>(defaultAccent);
  const [mounted, setMounted] = React.useState(false);
  const themeRef = React.useRef(theme);
  const accentRef = React.useRef(accent);

  React.useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  React.useEffect(() => {
    accentRef.current = accent;
  }, [accent]);

  const syncTheme = React.useCallback(
    (nextTheme: ThemePreference, options?: { persist?: boolean; withTransition?: boolean }) => {
      const nextResolvedTheme = resolveTheme(nextTheme, getSystemTheme());

      if (options?.withTransition) {
        startThemeTransition();
      }

      applyThemeToDocument(nextTheme, nextResolvedTheme);
      setThemeState(nextTheme);
      setResolvedTheme(nextResolvedTheme);

      // Re-apply accent with new resolved theme
      applyAccentToDocument(accentRef.current, nextResolvedTheme);

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

  const setAccent = React.useCallback(
    (nextAccent: AccentColor) => {
      if (mounted) {
        startThemeTransition();
      }

      setAccentState(nextAccent);
      accentRef.current = nextAccent;
      const currentResolved = resolveTheme(themeRef.current, getSystemTheme());
      applyAccentToDocument(nextAccent, currentResolved);
      persistAccentColor(nextAccent);
    },
    [mounted],
  );

  React.useEffect(() => {
    const initialTheme = readThemePreferenceFromDocument(readThemePreferenceFromStorage(defaultTheme));
    const initialAccent = readAccentFromDocument(readAccentFromStorage(defaultAccent));

    syncTheme(initialTheme, { persist: false });

    setAccentState(initialAccent);
    accentRef.current = initialAccent;
    const resolved = resolveTheme(initialTheme, getSystemTheme());
    applyAccentToDocument(initialAccent, resolved);

    setMounted(true);

    const unsubscribeSystemTheme = subscribeToSystemTheme(() => {
      if (themeRef.current !== "system") {
        return;
      }

      const nextResolvedTheme = resolveTheme("system", getSystemTheme());
      applyThemeToDocument("system", nextResolvedTheme);
      setResolvedTheme(nextResolvedTheme);
      applyAccentToDocument(accentRef.current, nextResolvedTheme);
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
  }, [defaultTheme, defaultAccent, syncTheme]);

  const value = React.useMemo(
    () => ({
      theme,
      resolvedTheme,
      accent,
      mounted,
      setTheme,
      setAccent,
    }),
    [accent, mounted, resolvedTheme, setAccent, setTheme, theme],
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
