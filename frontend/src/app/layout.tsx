import type { Metadata } from "next";
import { IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { AppToaster } from "@/components/ui/toaster";
import { getCurrentLocale } from "@/lib/locale-server";
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
  title: "Vercel CRM Suite",
  description: "Modern full-stack CRM for clients, leads, deals, promo codes, and admin workflows.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getCurrentLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${sans.variable} ${mono.variable} antialiased`}>
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
        <AppToaster />
      </body>
    </html>
  );
}
