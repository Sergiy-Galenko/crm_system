import { isPrismaDatabaseUnavailableError } from "@backend/common/database/prisma-errors";
import { ActivityFeed } from "@/components/activity-feed";
import { StatusBadge } from "@/components/status-badge";
import {
  activityAccessWhere,
  clientAccessWhere,
  dealAccessWhere,
  leadAccessWhere,
  taskAccessWhere,
} from "@/lib/crm-scope";
import { prisma } from "@/lib/db";
import { getServerTranslator } from "@/lib/locale-server";
import { requireUser } from "@/lib/session";
import { decimalToNumber, formatCurrency, formatDate, formatNumber, fromNow } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();
  const { locale, t } = await getServerTranslator();
  const stageOrder = ["DISCOVERY", "PROPOSAL", "NEGOTIATION", "WON", "LOST"] as const;
  const databaseUnavailableFromSession = "databaseUnavailable" in user && user.databaseUnavailable;
  const dashboardData = databaseUnavailableFromSession
    ? null
    : await Promise.all([
        prisma.lead.count({ where: leadAccessWhere(user) }),
        prisma.client.count({ where: clientAccessWhere(user) }),
        prisma.deal.count({ where: dealAccessWhere(user) }),
        prisma.deal.aggregate({
          where: { ...dealAccessWhere(user), stage: "WON" },
          _sum: { netAmount: true },
        }),
        prisma.activityLog.findMany({
          where: activityAccessWhere(user),
          orderBy: {
            createdAt: "desc",
          },
          take: 6,
          include: {
            actor: {
              select: {
                name: true,
                avatarColor: true,
                companyLogoUrl: true,
              },
            },
          },
        }),
        prisma.deal.groupBy({
          by: ["stage"],
          where: dealAccessWhere(user),
          _count: {
            _all: true,
          },
          orderBy: {
            stage: "asc",
          },
        }),
        prisma.task.findMany({
          where: {
            ...taskAccessWhere(user),
            status: {
              not: "DONE",
            },
          },
          orderBy: {
            dueDate: "asc",
          },
          take: 4,
          include: {
            client: {
              select: {
                company: true,
              },
            },
            assignedTo: {
              select: {
                name: true,
              },
            },
          },
        }),
      ]).catch((error) => {
        if (!isPrismaDatabaseUnavailableError(error)) {
          throw error;
        }

        return null;
      });

  const [
    leadsCount,
    clientsCount,
    dealsCount,
    wonRevenue,
    recentActivity,
    pipeline,
    upcomingTasks,
  ] = dashboardData ?? [
    0,
    0,
    0,
    { _sum: { netAmount: 0 } },
    [],
    [],
    [],
  ];

  const pipelineMap = new Map<string, number>(pipeline.map((item) => [item.stage, item._count._all]));
  const totalPipeline = [...pipelineMap.values()].reduce((sum, value) => sum + value, 0);
  const revenueValue = decimalToNumber(wonRevenue._sum.netAmount ?? 0);
  const summaryStats = [
    {
      label: t("Leads"),
      value: formatNumber(leadsCount, locale),
      meta: t("Active inbound and outbound opportunities."),
    },
    {
      label: t("Clients"),
      value: formatNumber(clientsCount, locale),
      meta: t("Accounts under active management."),
    },
    {
      label: t("Deals"),
      value: formatNumber(dealsCount, locale),
      meta: t("Full pipeline including won and lost."),
    },
  ];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2.4rem] border border-[var(--ui-border)] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--ui-surface-solid)_94%,transparent),color-mix(in_srgb,var(--ui-surface-muted)_100%,transparent))] shadow-[var(--ui-shadow-soft)]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-10 top-10 h-40 w-40 rounded-full bg-[color-mix(in_srgb,var(--ui-brand)_10%,transparent)] blur-3xl" />
          <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-[color-mix(in_srgb,var(--ui-brand)_8%,transparent)] blur-3xl" />
        </div>

        <div className="relative grid gap-6 p-6 sm:p-8 xl:grid-cols-[minmax(0,1.2fr)_22rem]">
          <div className="max-w-4xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">{t("Overview")}</p>
            <h1 className="mt-3 max-w-3xl text-[2.35rem] font-semibold tracking-tight text-slate-950 sm:text-[3rem]">
              {t("Revenue operations at a glance")}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
              {t("Track account momentum, pipeline health, promo-code performance, and follow-up workload from a single dashboard.")}
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {summaryStats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.6rem] border border-[var(--ui-border)] bg-[color-mix(in_srgb,var(--ui-surface-solid)_92%,transparent)] p-4 shadow-[var(--ui-shadow-xs)] backdrop-blur"
                >
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{item.value}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{item.meta}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-transparent bg-[var(--ui-brand)] p-5 text-[var(--ui-brand-foreground)] shadow-[var(--ui-shadow-strong)]">
            <p className="text-xs font-medium uppercase tracking-[0.18em] opacity-70">{t("Won revenue")}</p>
            <p className="mt-4 text-[2.4rem] font-semibold tracking-tight">{formatCurrency(revenueValue, "USD", locale)}</p>
            <p className="mt-2 text-sm leading-6 opacity-75">{t("Net value from won deals.")}</p>

            <div className="mt-6 space-y-3 border-t border-white/10 pt-4">
              {stageOrder.map((stage) => {
                const count = pipelineMap.get(stage) ?? 0;

                return (
                  <div key={stage} className="flex items-center justify-between gap-3 rounded-2xl bg-black/10 px-3.5 py-3">
                    <span className="text-sm font-medium opacity-90">{t(stage)}</span>
                    <span className="rounded-full border border-white/12 px-2.5 py-1 text-xs font-semibold opacity-90">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <ActivityFeed
          items={recentActivity.map((item) => ({
            ...item,
            createdAtLabel: formatDate(item.createdAt, locale, "MMM d, yyyy • HH:mm"),
          }))}
        />

        <div className="space-y-6">
          <section className="card p-5">
            <div>
              <h3 className="text-base font-semibold text-slate-950">{t("Today")}</h3>
              <p className="mt-1 text-sm text-slate-500">{t("The next follow-ups and promo activity that need attention.")}</p>
            </div>
            <div className="mt-5 space-y-4">
              {upcomingTasks.length ? (
                upcomingTasks.map((task) => (
                  <div key={task.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-slate-950">{task.title}</p>
                      <StatusBadge value={task.status} />
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      {task.client?.company ?? t("General task")} • {t("Assigned to {name}", { name: task.assignedTo?.name ?? t("Unassigned") })}
                    </p>
                    <p className="mt-3 text-xs uppercase tracking-[0.14em] text-slate-400">
                      {t("Due {time}", { time: fromNow(task.dueDate, locale) })}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-sm text-slate-500">
                  {t("No follow-ups are pending right now.")}
                </div>
              )}
            </div>
          </section>

          <section className="card p-5">
            <div>
              <h3 className="text-base font-semibold text-slate-950">{t("Pipeline distribution")}</h3>
              <p className="mt-1 text-sm text-slate-500">{t("Where current deal volume is concentrated.")}</p>
            </div>
            <div className="mt-5 space-y-4">
              {stageOrder.map((stage) => {
                const count = pipelineMap.get(stage) ?? 0;
                const width = totalPipeline ? Math.max(8, (count / totalPipeline) * 100) : 0;

                return (
                  <div key={stage}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{t(stage)}</span>
                      <span className="text-slate-500">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-slate-950" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
