import { NextResponse } from "next/server";
import { localeCookieName, resolveLocale } from "@/lib/locale";

export async function POST(request: Request) {
  const body = (await request.json()) as { locale?: string };
  const locale = resolveLocale(body.locale);

  const response = NextResponse.json({
    success: true,
    locale,
  });

  response.cookies.set(localeCookieName, locale, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
