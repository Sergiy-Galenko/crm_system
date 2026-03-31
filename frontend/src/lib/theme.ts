export const THEME_STORAGE_KEY = "koru-theme";
export const THEME_COOKIE_KEY = "koru-theme";
export const THEME_ATTRIBUTE = "data-theme";
export const THEME_PREFERENCE_ATTRIBUTE = "data-theme-preference";
export const THEME_TRANSITION_ATTRIBUTE = "data-theme-transition";
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
export const THEME_MEDIA_QUERY = "(prefers-color-scheme: dark)";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const DEFAULT_THEME_PREFERENCE: ThemePreference = "system";

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export function normalizeThemePreference(value: string | null | undefined): ThemePreference {
  return isThemePreference(value) ? value : DEFAULT_THEME_PREFERENCE;
}

export function resolveTheme(preference: ThemePreference, systemTheme: ResolvedTheme): ResolvedTheme {
  return preference === "system" ? systemTheme : preference;
}

export function readThemePreferenceFromDocument(fallback: ThemePreference = DEFAULT_THEME_PREFERENCE): ThemePreference {
  if (typeof document === "undefined") {
    return fallback;
  }

  return normalizeThemePreference(document.documentElement.dataset.themePreference);
}

export function readThemePreferenceFromStorage(fallback: ThemePreference = DEFAULT_THEME_PREFERENCE): ThemePreference {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    return normalizeThemePreference(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return fallback;
  }
}

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light";
  }

  return window.matchMedia(THEME_MEDIA_QUERY).matches ? "dark" : "light";
}

export function applyThemeToDocument(preference: ThemePreference, resolvedTheme: ResolvedTheme) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.setAttribute(THEME_ATTRIBUTE, resolvedTheme);
  root.setAttribute(THEME_PREFERENCE_ATTRIBUTE, preference);
  root.style.colorScheme = resolvedTheme;
}

export function persistThemePreference(preference: ThemePreference) {
  if (typeof document === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Ignore storage issues and keep the cookie / DOM state in sync.
  }

  document.cookie = `${THEME_COOKIE_KEY}=${preference}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; samesite=lax`;
}

export function startThemeTransition() {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return;
  }

  if (typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const root = document.documentElement;
  root.setAttribute(THEME_TRANSITION_ATTRIBUTE, "true");

  window.setTimeout(() => {
    root.removeAttribute(THEME_TRANSITION_ATTRIBUTE);
  }, 220);
}

export function subscribeToSystemTheme(listener: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }

  const mediaQuery = window.matchMedia(THEME_MEDIA_QUERY);

  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }

  mediaQuery.addListener(listener);
  return () => mediaQuery.removeListener(listener);
}

export function getThemeInitScript(defaultPreference: ThemePreference) {
  return `
(() => {
  const defaultPreference = ${JSON.stringify(defaultPreference)};
  const storageKey = ${JSON.stringify(THEME_STORAGE_KEY)};
  const cookieKey = ${JSON.stringify(THEME_COOKIE_KEY)};
  const cookieMaxAge = ${THEME_COOKIE_MAX_AGE};
  const isThemePreference = (value) => value === "light" || value === "dark" || value === "system";
  const readCookie = () => {
    const cookie = document.cookie
      .split("; ")
      .find((part) => part.startsWith(cookieKey + "="));

    return cookie ? decodeURIComponent(cookie.slice(cookieKey.length + 1)) : null;
  };

  let preference = defaultPreference;
  const cookiePreference = readCookie();

  if (isThemePreference(cookiePreference)) {
    preference = cookiePreference;
  } else {
    try {
      const storedPreference = window.localStorage.getItem(storageKey);
      if (isThemePreference(storedPreference)) {
        preference = storedPreference;
      }
    } catch {
      // Keep the server-provided default preference.
    }
  }

  const systemTheme = window.matchMedia && window.matchMedia(${JSON.stringify(THEME_MEDIA_QUERY)}).matches ? "dark" : "light";
  const resolvedTheme = preference === "system" ? systemTheme : preference;
  const root = document.documentElement;

  root.dataset.theme = resolvedTheme;
  root.dataset.themePreference = preference;
  root.style.colorScheme = resolvedTheme;

  try {
    window.localStorage.setItem(storageKey, preference);
  } catch {
    // Ignore storage errors and still keep the DOM / cookie in sync.
  }

  document.cookie = cookieKey + "=" + encodeURIComponent(preference) + "; path=/; max-age=" + cookieMaxAge + "; samesite=lax";
})();
`;
}
