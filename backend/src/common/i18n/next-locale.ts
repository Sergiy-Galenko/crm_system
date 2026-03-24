import "server-only";

import { cookies, headers } from "next/headers";
import { createTranslator } from "./i18n";
import { getPreferredLocale, localeCookieName, resolveLocale } from "./locale";

export async function getCurrentLocale() {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(localeCookieName)?.value;

  if (cookieLocale) {
    return resolveLocale(cookieLocale);
  }

  const headerStore = await headers();
  return getPreferredLocale(headerStore.get("accept-language"));
}

export async function getServerTranslator() {
  const locale = await getCurrentLocale();

  return {
    locale,
    t: createTranslator(locale),
  };
}
