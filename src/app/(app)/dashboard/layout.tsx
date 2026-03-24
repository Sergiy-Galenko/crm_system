import { addDays } from "date-fns";
import { AppShell } from "@/components/layout/app-shell";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

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
      meta: `Task due ${task.dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      createdAt: task.updatedAt,
    })),
    ...expiringPromoCodes.map((promoCode) => ({
      id: promoCode.id,
      label: `${promoCode.code} expires soon`,
      meta: `Promo code expires ${promoCode.expiresAt?.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
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
