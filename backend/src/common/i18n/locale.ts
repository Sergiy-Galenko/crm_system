export const localeCookieName = "crm_locale";

export const supportedLocales = ["en", "uk"] as const;

export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = "en";

export function isLocale(value: string | null | undefined): value is Locale {
  return supportedLocales.includes((value ?? "") as Locale);
}

export function resolveLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : defaultLocale;
}

export function getPreferredLocale(acceptLanguage: string | null | undefined): Locale {
  const normalized = (acceptLanguage ?? "").toLowerCase();

  if (normalized.includes("uk")) {
    return "uk";
  }

  return defaultLocale;
}
