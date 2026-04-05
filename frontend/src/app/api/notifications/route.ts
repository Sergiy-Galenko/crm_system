import { NextResponse } from "next/server";
import { getSession } from "@backend/common/next/session";
import { getNotificationsForUser, markAllNotificationsRead } from "@/lib/notification-store";

export const dynamic = "force-dynamic";

/** GET /api/notifications — fetch the latest notifications for the current user */
export async function GET() {
  const session = await getSession();

  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notifications = await getNotificationsForUser(session.userId, 20);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return NextResponse.json({ notifications, unreadCount });
}

/** DELETE /api/notifications — mark all as read */
export async function DELETE() {
  const session = await getSession();

  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await markAllNotificationsRead(session.userId);
  return NextResponse.json({ success: true });
}
