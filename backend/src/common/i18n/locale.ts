export const localeCookieName = "crm_locale";

export const supportedLocales = ["en", "uk", "pl", "de", "fr"] as const;

export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = "en";

export const localeLabelKeys: Record<Locale, string> = {
  en: "English",
  uk: "Ukrainian",
  pl: "Polish",
  de: "German",
  fr: "French",
};

export const localeIntlCodes: Record<Locale, string> = {
  en: "en-US",
  uk: "uk-UA",
  pl: "pl-PL",
  de: "de-DE",
  fr: "fr-FR",
};

export function isLocale(value: string | null | undefined): value is Locale {
  return supportedLocales.includes((value ?? "") as Locale);
}

export function resolveLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : defaultLocale;
}

export function getPreferredLocale(acceptLanguage: string | null | undefined): Locale {
  const languageTags = (acceptLanguage ?? "")
    .split(",")
    .map((part) => part.trim().split(";")[0]?.toLowerCase())
    .filter(Boolean);

  for (const tag of languageTags) {
    const baseTag = tag.split("-")[0];

    if (isLocale(baseTag)) {
      return baseTag;
    }
  }

  return defaultLocale;
}
