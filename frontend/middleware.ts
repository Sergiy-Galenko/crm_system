import type { NextRequest } from "next/server";
import { enforceDashboardSession } from "@backend/common/next/dashboard-auth";

export async function middleware(request: NextRequest) {
  return enforceDashboardSession(request);
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
