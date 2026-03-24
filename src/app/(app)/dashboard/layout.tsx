import { addDays } from "date-fns";
import { AppShell } from "@/components/layout/app-shell";
import { prisma } from "@/lib/db";
import { getServerTranslator } from "@/lib/locale-server";
import { requireUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const { locale, t } = await getServerTranslator();

  const [upcomingTasks, expiringPromoCodes] = await Promise.all([
    prisma.task.findMany({
      where: {
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
  ]);

  const notifications = [
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
    >
      {children}
    </AppShell>
  );
}
