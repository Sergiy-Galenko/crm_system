import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@backend/common/constants/app.constants";
import { verifySessionToken } from "@backend/common/auth/session-token";

export async function enforceDashboardSession(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const session = await verifySessionToken(token);

  if (!session?.userId) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  return NextResponse.next();
}
