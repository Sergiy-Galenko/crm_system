import { type ClassValue, clsx } from "clsx";
import { format, formatDistanceToNowStrict, type Locale as DateFnsLocale } from "date-fns";
import { de as deLocale, enUS, fr as frLocale, pl as plLocale, uk as ukLocale } from "date-fns/locale";
import { twMerge } from "tailwind-merge";
import { defaultLocale, localeIntlCodes, type Locale } from "@backend/common/i18n/locale";

const dateLocaleMap: Record<Locale, DateFnsLocale> = {
  en: enUS,
  uk: ukLocale,
  pl: plLocale,
  de: deLocale,
  fr: frLocale,
};

const emptyDateLabels: Record<Locale, string> = {
  en: "Not set",
  uk: "Не вказано",
  pl: "Nie ustawiono",
  de: "Nicht festgelegt",
  fr: "Non defini",
};

const monthDayPatterns: Record<Locale, string> = {
  en: "MMM d",
  uk: "d MMMM",
  pl: "d MMMM",
  de: "d. MMM",
  fr: "d MMM",
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getIntlLocale(locale: Locale = defaultLocale) {
  return localeIntlCodes[locale];
}

export function formatCurrency(value: number, currency = "USD", locale: Locale = defaultLocale) {
  return new Intl.NumberFormat(getIntlLocale(locale), {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number, locale: Locale = defaultLocale) {
  return new Intl.NumberFormat(getIntlLocale(locale)).format(value);
}

export function getDateLocale(locale: Locale = defaultLocale) {
  return dateLocaleMap[locale];
}

export function formatDate(
  value: Date | string | null | undefined,
  locale: Locale = defaultLocale,
  pattern = "MMM d, yyyy",
) {
  if (!value) {
    return emptyDateLabels[locale];
  }

  return format(new Date(value), pattern, {
    locale: getDateLocale(locale),
  });
}

export function formatIntlDate(
  value: Date | string | null | undefined,
  locale: Locale = defaultLocale,
  options?: Intl.DateTimeFormatOptions,
) {
  if (!value) {
    return emptyDateLabels[locale];
  }

  return new Intl.DateTimeFormat(getIntlLocale(locale), options).format(new Date(value));
}

export function formatMonthDay(value: Date | string, locale: Locale = defaultLocale) {
  return format(new Date(value), monthDayPatterns[locale], {
    locale: getDateLocale(locale),
  });
}

export function toDateInputValue(value: Date | string | null | undefined) {
  if (!value) {
    return "";
  }

  return format(new Date(value), "yyyy-MM-dd");
}

export function toDateTimeInputValue(value: Date | string | null | undefined) {
  if (!value) {
    return "";
  }

  return format(new Date(value), "yyyy-MM-dd'T'HH:mm");
}

export function fromNow(value: Date | string, locale: Locale = defaultLocale) {
  return formatDistanceToNowStrict(new Date(value), {
    addSuffix: true,
    locale: getDateLocale(locale),
  });
}

export function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((item) => item.charAt(0))
    .join("")
    .toUpperCase();
}

export function decimalToNumber(value: { toNumber(): number } | number) {
  return typeof value === "number" ? value : value.toNumber();
}

export function clampDiscount(baseAmount: number, discountAmount: number) {
  return Math.max(0, Math.min(baseAmount, discountAmount));
}
