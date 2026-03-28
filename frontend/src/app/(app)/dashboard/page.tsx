import { ActivityFeed } from "@/components/activity-feed";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import {
  activityAccessWhere,
  clientAccessWhere,
  dealAccessWhere,
  leadAccessWhere,
  promoCodeAccessWhere,
  taskAccessWhere,
} from "@/lib/crm-scope";
import { prisma } from "@/lib/db";
import { getServerTranslator } from "@/lib/locale-server";
import { requireUser } from "@/lib/session";
import { decimalToNumber, formatCurrency, formatNumber, fromNow } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();
  const { locale, t } = await getServerTranslator();
  const [
    leadsCount,
    clientsCount,
    dealsCount,
    wonRevenue,
    promoUsageAggregate,
    recentActivity,
    pipeline,
    upcomingTasks,
    topPromoCodes,
  ] = await Promise.all([
    prisma.lead.count({ where: leadAccessWhere(user) }),
    prisma.client.count({ where: clientAccessWhere(user) }),
    prisma.deal.count({ where: dealAccessWhere(user) }),
    prisma.deal.aggregate({
      where: { ...dealAccessWhere(user), stage: "WON" },
      _sum: { netAmount: true },
    }),
    prisma.promoCode.aggregate({
      where: promoCodeAccessWhere(user),
      _sum: {
        usedCount: true,
      },
      _count: {
        _all: true,
      },
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
    prisma.promoCode.findMany({
      where: promoCodeAccessWhere(user),
      orderBy: {
        usedCount: "desc",
      },
      take: 4,
    }),
  ]);

  const pipelineMap = new Map<string, number>(pipeline.map((item) => [item.stage, item._count._all]));
  const totalPipeline = [...pipelineMap.values()].reduce((sum, value) => sum + value, 0);
  const revenueValue = decimalToNumber(wonRevenue._sum.netAmount ?? 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("Overview")}
        title={t("Revenue operations at a glance")}
        description={t("Track account momentum, pipeline health, promo-code performance, and follow-up workload from a single dashboard.")}
      />

      <div className="grid gap-4 xl:grid-cols-4">
        <MetricCard label={t("Leads")} value={formatNumber(leadsCount)} meta={t("Active inbound and outbound opportunities.")} />
        <MetricCard label={t("Clients")} value={formatNumber(clientsCount)} meta={t("Accounts under active management.")} />
        <MetricCard label={t("Deals")} value={formatNumber(dealsCount)} meta={t("Full pipeline including won and lost.")} />
        <MetricCard
          label={t("Revenue")}
          value={formatCurrency(revenueValue)}
          meta={t("Net value from won deals.")}
          tone="brand"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <ActivityFeed items={recentActivity} />

        <div className="space-y-6">
          <section className="card p-5">
            <div>
              <h3 className="text-base font-semibold text-slate-950">{t("Pipeline distribution")}</h3>
              <p className="mt-1 text-sm text-slate-500">{t("Where current deal volume is concentrated.")}</p>
            </div>
            <div className="mt-5 space-y-4">
              {(["DISCOVERY", "PROPOSAL", "NEGOTIATION", "WON", "LOST"] as const).map((stage) => {
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

          <section className="card p-5">
            <div>
              <h3 className="text-base font-semibold text-slate-950">{t("Today")}</h3>
              <p className="mt-1 text-sm text-slate-500">{t("The next follow-ups and promo activity that need attention.")}</p>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-950">{t("Promo code usage")}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {t("{count} total promo codes in the library.", { count: promoUsageAggregate._count._all })}
                  </p>
                </div>
                <p className="text-2xl font-semibold tracking-tight text-slate-950">
                  {formatNumber(promoUsageAggregate._sum.usedCount ?? 0)}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {upcomingTasks.length ? (
                upcomingTasks.map((task) => (
                  <div key={task.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-slate-950">{task.title}</p>
                      <StatusBadge value={task.status} />
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      {task.client?.company ?? t("General task")} • {t("Assigned to {name}", { name: task.assignedTo.name })}
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
        </div>
      </div>

      <section className="card p-5">
        <div>
          <h3 className="text-base font-semibold text-slate-950">{t("Top promo codes")}</h3>
          <p className="mt-1 text-sm text-slate-500">{t("Most-used discount campaigns right now.")}</p>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
          {topPromoCodes.map((promoCode) => (
            <div key={promoCode.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-950">{promoCode.code}</p>
                  <p className="mt-1 text-sm text-slate-500">{promoCode.description ?? t("No description added.")}</p>
                </div>
                <StatusBadge value={promoCode.active ? "ACTIVE" : "INACTIVE"} />
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                <span>{promoCode.usedCount} {t("usages")}</span>
                <span>
                  {promoCode.discountType === "PERCENT"
                    ? `${decimalToNumber(promoCode.discountValue)}% off`
                    : formatCurrency(decimalToNumber(promoCode.discountValue))}
                </span>
              </div>
            </div>
          ))}
          {!topPromoCodes.length ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-sm text-slate-500 lg:col-span-2 xl:col-span-4">
              {t("Promo codes will appear here once the team starts using them.")}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
