import type { Metadata } from "next";
import Script from "next/script";
import { cookies } from "next/headers";
import { IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AppToaster } from "@/components/ui/toaster";
import { getCurrentLocale } from "@/lib/locale-server";
import { getThemeInitScript, normalizeThemePreference, THEME_ATTRIBUTE, THEME_COOKIE_KEY, THEME_PREFERENCE_ATTRIBUTE } from "@/lib/theme";
import "@/app/globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Nexora CRM",
  description: "Nexora CRM is a modern full-stack workspace for clients, leads, deals, promo codes, and admin workflows.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const locale = await getCurrentLocale();
  const themePreference = normalizeThemePreference(cookieStore.get(THEME_COOKIE_KEY)?.value);
  const serverTheme = themePreference === "dark" ? "dark" : "light";

  return (
    <html lang={locale} {...{ [THEME_ATTRIBUTE]: serverTheme, [THEME_PREFERENCE_ATTRIBUTE]: themePreference }} suppressHydrationWarning>
      <body className={`${sans.variable} ${mono.variable} antialiased`}>
        <Script id="theme-init" strategy="beforeInteractive">
          {getThemeInitScript(themePreference)}
        </Script>
        <ThemeProvider defaultTheme={themePreference}>
          <LocaleProvider locale={locale}>
            {children}
            <AppToaster />
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
