import { addDays } from "date-fns";
import { AppShell } from "@/components/layout/app-shell";
import { promoCodeAccessWhere, taskAccessWhere } from "@/lib/crm-scope";
import { prisma } from "@/lib/db";
import { getServerTranslator } from "@/lib/locale-server";
import { requireUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const { locale, t } = await getServerTranslator();

  const [upcomingTasks, expiringPromoCodes, myUpcomingMeetings] = await Promise.all([
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
  ]);

  const notifications = [
    ...myUpcomingMeetings.map((meeting) => ({
      id: meeting.id,
      label: t("Meeting with {company}", { company: meeting.client.company }),
      meta: t("Scheduled for {date}", { date: formatDate(meeting.startsAt, locale, "MMM d, yyyy • HH:mm") }),
      createdAt: meeting.startsAt,
    })),
    ...upcomingTasks.map((task) => ({
      id: task.id,
      label: task.title,
      meta: t("Task due {date}", { date: formatDate(task.dueDate, locale, "MMM d") }),
      createdAt: task.updatedAt,
    })),
    ...expiringPromoCodes.map((promoCode) => ({
      id: promoCode.id,
      label: t("{code} expires soon", { code: promoCode.code }),
      meta: t("Promo code expires {date}", {
        date: promoCode.expiresAt ? formatDate(promoCode.expiresAt, locale, "MMM d") : t("No expiry"),
      }),
      createdAt: promoCode.updatedAt,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  return (
    <AppShell
      user={user}
      notifications={notifications}
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
