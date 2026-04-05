import { addDays } from "date-fns";
import { isPrismaDatabaseUnavailableError } from "@backend/common/database/prisma-errors";
import { AppShell } from "@/components/layout/app-shell";
import { promoCodeAccessWhere, taskAccessWhere } from "@/lib/crm-scope";
import { prisma } from "@/lib/db";
import { chatDb } from "@/lib/chat-db";
import { getServerTranslator } from "@/lib/locale-server";
import { requireUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const { locale, t } = await getServerTranslator();
  let databaseUnavailable = "databaseUnavailable" in user && user.databaseUnavailable;

  const layoutData = databaseUnavailable
    ? null
    : await Promise.all([
        prisma.task.findMany({
          where: {
            ...taskAccessWhere(user),
            status: {
              not: "DONE",
            },
            dueDate: {
              lte: addDays(new Date(), 5),
            },
          },
          orderBy: {
            dueDate: "asc",
          },
          take: 3,
        }),
        prisma.promoCode.findMany({
          where: {
            ...promoCodeAccessWhere(user),
            active: true,
            expiresAt: {
              lte: addDays(new Date(), 7),
            },
          },
          orderBy: {
            expiresAt: "asc",
          },
          take: 3,
        }),
        prisma.meeting.findMany({
          where: {
            assignedToId: user.id,
            status: "SCHEDULED",
            startsAt: {
              gte: new Date(),
              lte: addDays(new Date(), 7),
            },
          },
          include: {
            client: {
              select: {
                company: true,
              },
            },
          },
          orderBy: {
            startsAt: "asc",
          },
          take: 3,
        }),
        prisma.activityLog.findMany({
          where: {
            entity: "USER",
            action: "UPDATED",
            entityId: user.id,
            description: {
              contains: "joined your team",
            },
          },
          include: {
            actor: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 3,
        }),
        chatDb.chatConversation.findMany({
          where: {
            participants: {
              some: {
                userId: user.id,
              },
            },
          },
          orderBy: {
            lastMessageAt: "desc",
          },
          take: 12,
          select: {
            id: true,
            messages: {
              take: 1,
              orderBy: {
                createdAt: "desc",
              },
              select: {
                senderId: true,
                createdAt: true,
              },
            },
          },
        }),
        chatDb.$queryRaw<Array<{ conversationId: string; lastReadAt: Date }>>`
          SELECT "conversationId", "lastReadAt"
          FROM "ChatParticipant"
          WHERE "userId" = ${user.id}
        `,
      ]).catch((error) => {
        if (!isPrismaDatabaseUnavailableError(error)) {
          throw error;
        }

        databaseUnavailable = true;
        return null;
      });

  const [, , myUpcomingMeetings, , recentChatThreads, chatReadStates] =
    layoutData ?? [[], [], [], [], [], []];
  const chatReadStateByConversationId = new Map(chatReadStates.map((item) => [item.conversationId, item.lastReadAt]));

  const chatIndicatorCount = recentChatThreads.filter((conversation) => {
    const lastMessage = conversation.messages[0];
    const lastReadAt = chatReadStateByConversationId.get(conversation.id);

    if (!lastMessage || !lastReadAt) {
      return false;
    }

    return lastMessage.senderId !== user.id && lastMessage.createdAt > lastReadAt;
  }).length;

  return (
    <AppShell
      user={user}
      chatIndicatorCount={chatIndicatorCount}
      systemNotice={
        databaseUnavailable
          ? {
              title: t("Database connection unavailable."),
              description: t("Start PostgreSQL on localhost:5432 and refresh the page."),
            }
          : undefined
      }
      meetingReminder={
        myUpcomingMeetings[0]
          ? {
              title: t("Upcoming meeting"),
              description: t("{company} on {date}", {
                company: myUpcomingMeetings[0].client.company,
                date: formatDate(myUpcomingMeetings[0].startsAt, locale, "MMM d, yyyy • HH:mm"),
              }),
              href: "/dashboard/meetings",
            }
          : undefined
      }
    >
      {children}
    </AppShell>
  );
}
