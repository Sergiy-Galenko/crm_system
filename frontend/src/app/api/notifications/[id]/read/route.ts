import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@backend/common/next/session";
import { markNotificationRead } from "@/lib/notification-store";

export const dynamic = "force-dynamic";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();

  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await markNotificationRead(id, session.userId);

  return NextResponse.json({ success: true });
}
