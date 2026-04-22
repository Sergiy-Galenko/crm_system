import { addDays } from "date-fns";
import { isPrismaDatabaseUnavailableError } from "@backend/common/database/prisma-errors";
import { AppShell } from "@/components/layout/app-shell";
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
        chatDb.$queryRaw<Array<{ unreadCount: bigint }>>`
          SELECT COUNT(*)::bigint AS "unreadCount"
          FROM "ChatParticipant" participant
          JOIN LATERAL (
            SELECT message."senderId", message."createdAt"
            FROM "ChatMessage" message
            WHERE message."conversationId" = participant."conversationId"
            ORDER BY message."createdAt" DESC
            LIMIT 1
          ) latest_message ON TRUE
          WHERE participant."userId" = ${user.id}
            AND latest_message."senderId" <> ${user.id}
            AND latest_message."createdAt" > participant."lastReadAt"
        `,
      ]).catch((error) => {
        if (!isPrismaDatabaseUnavailableError(error)) {
          throw error;
        }

        databaseUnavailable = true;
        return null;
      });

  const [myUpcomingMeetings, chatUnreadRows] = layoutData ?? [[], []];
  const chatIndicatorCount = Number(chatUnreadRows[0]?.unreadCount ?? 0);

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
