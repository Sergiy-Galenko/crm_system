import { pushNotification, type SsePayload } from "./notification-stream";

export type CreateNotificationInput = {
  userId: string;
  title: string;
  body: string;
};

async function getPrisma() {
  const { prisma } = await import("@backend/common/database/prisma.service");
  return prisma;
}

/**
 * Creates a persistent notification in the DB and, if the user has an open
 * SSE connection, pushes it to them in real-time.
 */
export async function createAndPushNotification(input: CreateNotificationInput) {
  const prisma = await getPrisma();
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      body: input.body,
    },
  });

  const payload: SsePayload = {
    id: notification.id,
    title: notification.title,
    body: notification.body,
    createdAt: notification.createdAt.toISOString(),
  };

  pushNotification(input.userId, payload);

  return notification;
}

export async function getNotificationsForUser(userId: string, limit = 20) {
  const prisma = await getPrisma();
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      body: true,
      read: true,
      createdAt: true,
    },
  });
}

export async function markNotificationRead(notificationId: string, userId: string) {
  const prisma = await getPrisma();
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { read: true },
  });
}

export async function markAllNotificationsRead(userId: string) {
  const prisma = await getPrisma();
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}
