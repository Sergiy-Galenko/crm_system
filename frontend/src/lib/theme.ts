export const THEME_STORAGE_KEY = "koru-theme";
export const THEME_COOKIE_KEY = "koru-theme";
export const THEME_ATTRIBUTE = "data-theme";
export const THEME_PREFERENCE_ATTRIBUTE = "data-theme-preference";
export const THEME_TRANSITION_ATTRIBUTE = "data-theme-transition";
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
export const THEME_MEDIA_QUERY = "(prefers-color-scheme: dark)";

export const ACCENT_STORAGE_KEY = "koru-accent";
export const ACCENT_COOKIE_KEY = "koru-accent";
export const ACCENT_ATTRIBUTE = "data-accent";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const DEFAULT_THEME_PREFERENCE: ThemePreference = "system";


export type AccentColor =
  | "slate"
  | "blue"
  | "violet"
  | "rose"
  | "amber"
  | "emerald"
  | "cyan"
  | "orange";
export const DEFAULT_ACCENT: AccentColor = "slate";

export type AccentPreset = {
  id: AccentColor;
  label: string;
  swatch: string;
  light: {
    brand: string;
    brandHover: string;
    brandForeground: string;
    ring: string;
    backgroundTop: string;
    sidebarFrom: string;
    sidebarVia: string;
    sidebarTo: string;
    sidebarGlow: string;
    sidebarCardFrom: string;
    sidebarCardTo: string;
    sidebarActive: string;
  };
  dark: {
    brand: string;
    brandHover: string;
    brandForeground: string;
    ring: string;
    backgroundTop: string;
    sidebarFrom: string;
    sidebarVia: string;
    sidebarTo: string;
    sidebarGlow: string;
    sidebarCardFrom: string;
    sidebarCardTo: string;
    sidebarActive: string;
  };
};

export const ACCENT_PRESETS: AccentPreset[] = [
  {
    id: "slate",
    label: "Slate",
    swatch: "#231e52",
    light: {
      brand: "#0f172a",
      brandHover: "#020617",
      brandForeground: "#ffffff",
      ring: "rgba(37, 99, 235, 0.18)",
      backgroundTop: "rgba(59, 130, 246, 0.1)",
      sidebarFrom: "#231e52",
      sidebarVia: "#221d4d",
      sidebarTo: "#19163a",
      sidebarGlow: "rgba(255,255,255,0.12)",
      sidebarCardFrom: "rgba(167,164,190,0.98)",
      sidebarCardTo: "rgba(147,144,173,0.94)",
      sidebarActive: "rgba(10,15,37,0.96)",
    },
    dark: {
      brand: "#f8fafc",
      brandHover: "#e2e8f0",
      brandForeground: "#0f172a",
      ring: "rgba(96, 165, 250, 0.26)",
      backgroundTop: "rgba(59, 130, 246, 0.16)",
      sidebarFrom: "#231e52",
      sidebarVia: "#221d4d",
      sidebarTo: "#19163a",
      sidebarGlow: "rgba(255,255,255,0.12)",
      sidebarCardFrom: "rgba(167,164,190,0.98)",
      sidebarCardTo: "rgba(147,144,173,0.94)",
      sidebarActive: "rgba(10,15,37,0.96)",
    },
  },
  {
    id: "blue",
    label: "Blue",
    swatch: "#2563eb",
    light: {
      brand: "#2563eb",
      brandHover: "#1d4ed8",
      brandForeground: "#ffffff",
      ring: "rgba(37, 99, 235, 0.22)",
      backgroundTop: "rgba(37, 99, 235, 0.12)",
      sidebarFrom: "#1e3a6e",
      sidebarVia: "#1c3564",
      sidebarTo: "#142847",
      sidebarGlow: "rgba(96,165,250,0.16)",
      sidebarCardFrom: "rgba(147,179,225,0.96)",
      sidebarCardTo: "rgba(120,157,210,0.92)",
      sidebarActive: "rgba(30,58,110,0.96)",
    },
    dark: {
      brand: "#60a5fa",
      brandHover: "#93bbfd",
      brandForeground: "#0c1b38",
      ring: "rgba(96, 165, 250, 0.3)",
      backgroundTop: "rgba(37, 99, 235, 0.18)",
      sidebarFrom: "#1e3a6e",
      sidebarVia: "#1c3564",
      sidebarTo: "#142847",
      sidebarGlow: "rgba(96,165,250,0.16)",
      sidebarCardFrom: "rgba(147,179,225,0.96)",
      sidebarCardTo: "rgba(120,157,210,0.92)",
      sidebarActive: "rgba(30,58,110,0.96)",
    },
  },
  {
    id: "violet",
    label: "Violet",
    swatch: "#7c3aed",
    light: {
      brand: "#7c3aed",
      brandHover: "#6d28d9",
      brandForeground: "#ffffff",
      ring: "rgba(124, 58, 237, 0.22)",
      backgroundTop: "rgba(124, 58, 237, 0.1)",
      sidebarFrom: "#2e1a5e",
      sidebarVia: "#2b1856",
      sidebarTo: "#1f1340",
      sidebarGlow: "rgba(167,139,250,0.16)",
      sidebarCardFrom: "rgba(175,155,215,0.96)",
      sidebarCardTo: "rgba(152,132,195,0.92)",
      sidebarActive: "rgba(46,26,94,0.96)",
    },
    dark: {
      brand: "#a78bfa",
      brandHover: "#c4b5fd",
      brandForeground: "#1a0e36",
      ring: "rgba(167, 139, 250, 0.3)",
      backgroundTop: "rgba(124, 58, 237, 0.16)",
      sidebarFrom: "#2e1a5e",
      sidebarVia: "#2b1856",
      sidebarTo: "#1f1340",
      sidebarGlow: "rgba(167,139,250,0.16)",
      sidebarCardFrom: "rgba(175,155,215,0.96)",
      sidebarCardTo: "rgba(152,132,195,0.92)",
      sidebarActive: "rgba(46,26,94,0.96)",
    },
  },
  {
    id: "rose",
    label: "Rose",
    swatch: "#e11d48",
    light: {
      brand: "#e11d48",
      brandHover: "#be123c",
      brandForeground: "#ffffff",
      ring: "rgba(225, 29, 72, 0.2)",
      backgroundTop: "rgba(225, 29, 72, 0.08)",
      sidebarFrom: "#5c1a2e",
      sidebarVia: "#541728",
      sidebarTo: "#3e111e",
      sidebarGlow: "rgba(251,113,133,0.14)",
      sidebarCardFrom: "rgba(210,148,165,0.96)",
      sidebarCardTo: "rgba(190,128,148,0.92)",
      sidebarActive: "rgba(92,26,46,0.96)",
    },
    dark: {
      brand: "#fb7185",
      brandHover: "#fda4af",
      brandForeground: "#2a0612",
      ring: "rgba(251, 113, 133, 0.28)",
      backgroundTop: "rgba(225, 29, 72, 0.14)",
      sidebarFrom: "#5c1a2e",
      sidebarVia: "#541728",
      sidebarTo: "#3e111e",
      sidebarGlow: "rgba(251,113,133,0.14)",
      sidebarCardFrom: "rgba(210,148,165,0.96)",
      sidebarCardTo: "rgba(190,128,148,0.92)",
      sidebarActive: "rgba(92,26,46,0.96)",
    },
  },
  {
    id: "amber",
    label: "Amber",
    swatch: "#d97706",
    light: {
      brand: "#d97706",
      brandHover: "#b45309",
      brandForeground: "#ffffff",
      ring: "rgba(217, 119, 6, 0.2)",
      backgroundTop: "rgba(217, 119, 6, 0.08)",
      sidebarFrom: "#5e3a10",
      sidebarVia: "#55340e",
      sidebarTo: "#3f270a",
      sidebarGlow: "rgba(251,191,36,0.14)",
      sidebarCardFrom: "rgba(210,178,130,0.96)",
      sidebarCardTo: "rgba(190,158,112,0.92)",
      sidebarActive: "rgba(94,58,16,0.96)",
    },
    dark: {
      brand: "#fbbf24",
      brandHover: "#fcd34d",
      brandForeground: "#1c1004",
      ring: "rgba(251, 191, 36, 0.28)",
      backgroundTop: "rgba(217, 119, 6, 0.14)",
      sidebarFrom: "#5e3a10",
      sidebarVia: "#55340e",
      sidebarTo: "#3f270a",
      sidebarGlow: "rgba(251,191,36,0.14)",
      sidebarCardFrom: "rgba(210,178,130,0.96)",
      sidebarCardTo: "rgba(190,158,112,0.92)",
      sidebarActive: "rgba(94,58,16,0.96)",
    },
  },
  {
    id: "emerald",
    label: "Emerald",
    swatch: "#059669",
    light: {
      brand: "#059669",
      brandHover: "#047857",
      brandForeground: "#ffffff",
      ring: "rgba(5, 150, 105, 0.2)",
      backgroundTop: "rgba(5, 150, 105, 0.08)",
      sidebarFrom: "#0e3e2e",
      sidebarVia: "#0d3828",
      sidebarTo: "#092a1e",
      sidebarGlow: "rgba(52,211,153,0.14)",
      sidebarCardFrom: "rgba(130,195,170,0.96)",
      sidebarCardTo: "rgba(110,175,152,0.92)",
      sidebarActive: "rgba(14,62,46,0.96)",
    },
    dark: {
      brand: "#34d399",
      brandHover: "#6ee7b7",
      brandForeground: "#02200f",
      ring: "rgba(52, 211, 153, 0.28)",
      backgroundTop: "rgba(5, 150, 105, 0.14)",
      sidebarFrom: "#0e3e2e",
      sidebarVia: "#0d3828",
      sidebarTo: "#092a1e",
      sidebarGlow: "rgba(52,211,153,0.14)",
      sidebarCardFrom: "rgba(130,195,170,0.96)",
      sidebarCardTo: "rgba(110,175,152,0.92)",
      sidebarActive: "rgba(14,62,46,0.96)",
    },
  },
  {
    id: "cyan",
    label: "Cyan",
    swatch: "#0891b2",
    light: {
      brand: "#0891b2",
      brandHover: "#0e7490",
      brandForeground: "#ffffff",
      ring: "rgba(8, 145, 178, 0.2)",
      backgroundTop: "rgba(8, 145, 178, 0.08)",
      sidebarFrom: "#0e3646",
      sidebarVia: "#0d3140",
      sidebarTo: "#09242f",
      sidebarGlow: "rgba(34,211,238,0.14)",
      sidebarCardFrom: "rgba(130,185,200,0.96)",
      sidebarCardTo: "rgba(110,168,185,0.92)",
      sidebarActive: "rgba(14,54,70,0.96)",
    },
    dark: {
      brand: "#22d3ee",
      brandHover: "#67e8f9",
      brandForeground: "#021e26",
      ring: "rgba(34, 211, 238, 0.28)",
      backgroundTop: "rgba(8, 145, 178, 0.14)",
      sidebarFrom: "#0e3646",
      sidebarVia: "#0d3140",
      sidebarTo: "#09242f",
      sidebarGlow: "rgba(34,211,238,0.14)",
      sidebarCardFrom: "rgba(130,185,200,0.96)",
      sidebarCardTo: "rgba(110,168,185,0.92)",
      sidebarActive: "rgba(14,54,70,0.96)",
    },
  },
  {
    id: "orange",
    label: "Orange",
    swatch: "#ea580c",
    light: {
      brand: "#ea580c",
      brandHover: "#c2410c",
      brandForeground: "#ffffff",
      ring: "rgba(234, 88, 12, 0.2)",
      backgroundTop: "rgba(234, 88, 12, 0.08)",
      sidebarFrom: "#5e2a0e",
      sidebarVia: "#55260c",
      sidebarTo: "#3f1c08",
      sidebarGlow: "rgba(251,146,60,0.14)",
      sidebarCardFrom: "rgba(215,165,130,0.96)",
      sidebarCardTo: "rgba(195,148,115,0.92)",
      sidebarActive: "rgba(94,42,14,0.96)",
    },
    dark: {
      brand: "#fb923c",
      brandHover: "#fdba74",
      brandForeground: "#1c0e04",
      ring: "rgba(251, 146, 60, 0.28)",
      backgroundTop: "rgba(234, 88, 12, 0.14)",
      sidebarFrom: "#5e2a0e",
      sidebarVia: "#55260c",
      sidebarTo: "#3f1c08",
      sidebarGlow: "rgba(251,146,60,0.14)",
      sidebarCardFrom: "rgba(215,165,130,0.96)",
      sidebarCardTo: "rgba(195,148,115,0.92)",
      sidebarActive: "rgba(94,42,14,0.96)",
    },
  },
];

export function isAccentColor(value: unknown): value is AccentColor {
  return ACCENT_PRESETS.some((p) => p.id === value);
}

export function normalizeAccentColor(value: string | null | undefined): AccentColor {
  return isAccentColor(value) ? value : DEFAULT_ACCENT;
}

export function getAccentPreset(accent: AccentColor): AccentPreset {
  return ACCENT_PRESETS.find((p) => p.id === accent) ?? ACCENT_PRESETS[0];
}

export function applyAccentToDocument(accent: AccentColor, resolvedTheme: ResolvedTheme) {
  if (typeof document === "undefined") {
    return;
  }

  const preset = getAccentPreset(accent);
  const palette = resolvedTheme === "dark" ? preset.dark : preset.light;
  const root = document.documentElement;

  root.setAttribute(ACCENT_ATTRIBUTE, accent);
  root.style.setProperty("--ui-brand", palette.brand);
  root.style.setProperty("--ui-brand-hover", palette.brandHover);
  root.style.setProperty("--ui-brand-foreground", palette.brandForeground);
  root.style.setProperty("--ui-ring", palette.ring);
  root.style.setProperty("--ui-background-top", palette.backgroundTop);
  root.style.setProperty("--sidebar-from", palette.sidebarFrom);
  root.style.setProperty("--sidebar-via", palette.sidebarVia);
  root.style.setProperty("--sidebar-to", palette.sidebarTo);
  root.style.setProperty("--sidebar-glow", palette.sidebarGlow);
  root.style.setProperty("--sidebar-card-from", palette.sidebarCardFrom);
  root.style.setProperty("--sidebar-card-to", palette.sidebarCardTo);
  root.style.setProperty("--sidebar-active", palette.sidebarActive);
}

export function readAccentFromStorage(fallback: AccentColor = DEFAULT_ACCENT): AccentColor {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    return normalizeAccentColor(window.localStorage.getItem(ACCENT_STORAGE_KEY));
  } catch {
    return fallback;
  }
}

export function readAccentFromDocument(fallback: AccentColor = DEFAULT_ACCENT): AccentColor {
  if (typeof document === "undefined") {
    return fallback;
  }

  return normalizeAccentColor(document.documentElement.getAttribute(ACCENT_ATTRIBUTE));
}

export function persistAccentColor(accent: AccentColor) {
  if (typeof document === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(ACCENT_STORAGE_KEY, accent);
  } catch {
    // Ignore storage issues.
  }

  document.cookie = `${ACCENT_COOKIE_KEY}=${accent}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; samesite=lax`;
}

/* ------------------------------------------------------------------ */
/*  Theme preference helpers (unchanged)                              */
/* ------------------------------------------------------------------ */

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
  const accentStorageKey = ${JSON.stringify(ACCENT_STORAGE_KEY)};
  const accentCookieKey = ${JSON.stringify(ACCENT_COOKIE_KEY)};
  const cookieMaxAge = ${THEME_COOKIE_MAX_AGE};
  const accentPresets = ${JSON.stringify(ACCENT_PRESETS.map((p) => ({ id: p.id, light: p.light, dark: p.dark })))};
  const defaultAccent = ${JSON.stringify(DEFAULT_ACCENT)};
  const isThemePreference = (value) => value === "light" || value === "dark" || value === "system";
  const isAccent = (value) => accentPresets.some((p) => p.id === value);
  const readCookie = (key) => {
    const cookie = document.cookie
      .split("; ")
      .find((part) => part.startsWith(key + "="));

    return cookie ? decodeURIComponent(cookie.slice(key.length + 1)) : null;
  };

  let preference = defaultPreference;
  const cookiePreference = readCookie(cookieKey);

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

  /* Accent colour */
  let accent = defaultAccent;
  const cookieAccent = readCookie(accentCookieKey);
  if (isAccent(cookieAccent)) {
    accent = cookieAccent;
  } else {
    try {
      const storedAccent = window.localStorage.getItem(accentStorageKey);
      if (isAccent(storedAccent)) {
        accent = storedAccent;
      }
    } catch {}
  }

  root.setAttribute("data-accent", accent);
  const preset = accentPresets.find((p) => p.id === accent);
  if (preset) {
    const palette = resolvedTheme === "dark" ? preset.dark : preset.light;
    root.style.setProperty("--ui-brand", palette.brand);
    root.style.setProperty("--ui-brand-hover", palette.brandHover);
    root.style.setProperty("--ui-brand-foreground", palette.brandForeground);
    root.style.setProperty("--ui-ring", palette.ring);
    root.style.setProperty("--ui-background-top", palette.backgroundTop);
    root.style.setProperty("--sidebar-from", palette.sidebarFrom);
    root.style.setProperty("--sidebar-via", palette.sidebarVia);
    root.style.setProperty("--sidebar-to", palette.sidebarTo);
    root.style.setProperty("--sidebar-glow", palette.sidebarGlow);
    root.style.setProperty("--sidebar-card-from", palette.sidebarCardFrom);
    root.style.setProperty("--sidebar-card-to", palette.sidebarCardTo);
    root.style.setProperty("--sidebar-active", palette.sidebarActive);
  }

  try {
    window.localStorage.setItem(accentStorageKey, accent);
  } catch {}
  document.cookie = accentCookieKey + "=" + encodeURIComponent(accent) + "; path=/; max-age=" + cookieMaxAge + "; samesite=lax";
})();
`;
}
