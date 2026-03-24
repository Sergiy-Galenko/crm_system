import { type ClassValue, clsx } from "clsx";
import { format, formatDistanceToNowStrict } from "date-fns";
import { enUS, uk as ukLocale } from "date-fns/locale";
import { twMerge } from "tailwind-merge";
import { defaultLocale, type Locale } from "@backend/common/i18n/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function getDateLocale(locale: Locale) {
  return locale === "uk" ? ukLocale : enUS;
}

export function formatDate(
  value: Date | string | null | undefined,
  locale: Locale = defaultLocale,
  pattern = "MMM d, yyyy",
) {
  if (!value) {
    return locale === "uk" ? "Не вказано" : "Not set";
  }

  return format(new Date(value), pattern, {
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
