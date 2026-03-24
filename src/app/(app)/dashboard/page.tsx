import Link from "next/link";
import { ArrowRight, CircleCheckBig, Clock3, Sparkles, TicketPercent } from "lucide-react";
import { ActivityFeed } from "@/components/activity-feed";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { activityAccessWhere, clientAccessWhere, dealAccessWhere, leadAccessWhere, promoCodeAccessWhere, taskAccessWhere } from "@/lib/crm-scope";
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
      take: 5,
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
        actions={
          <Button asChild>
            <Link href="/dashboard/deals">
              {t("Open deals")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-5">
        <MetricCard label={t("Leads")} value={formatNumber(leadsCount)} meta={t("Active inbound and outbound opportunities.")} />
        <MetricCard label={t("Clients")} value={formatNumber(clientsCount)} meta={t("Accounts under active management.")} />
        <MetricCard label={t("Deals")} value={formatNumber(dealsCount)} meta={t("Full pipeline including won and lost.")} />
        <MetricCard
          label={t("Revenue")}
          value={formatCurrency(revenueValue)}
          meta={t("Net value from won deals.")}
          tone="brand"
        />
        <MetricCard
          label={t("Promo usage")}
          value={formatNumber(promoUsageAggregate._sum.usedCount ?? 0)}
          meta={t("{count} total promo codes in the library.", { count: promoUsageAggregate._count._all })}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <ActivityFeed items={recentActivity} />

        <div className="space-y-6">
          <div className="card rounded-[2rem] p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">{t("Pipeline distribution")}</h3>
                <p className="mt-1 text-sm text-slate-500">{t("Where current deal volume is concentrated.")}</p>
              </div>
              <Sparkles className="h-5 w-5 text-slate-400" />
            </div>
            <div className="mt-6 space-y-4">
              {(["DISCOVERY", "PROPOSAL", "NEGOTIATION", "WON", "LOST"] as const).map((stage) => {
                const count = pipelineMap.get(stage) ?? 0;
                const width = totalPipeline ? Math.max(8, (count / totalPipeline) * 100) : 0;

                return (
                  <div key={stage}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{t(stage)}</span>
                      <span className="text-slate-500">{count}</span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-100">
                      <div className="h-3 rounded-full bg-slate-950" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card rounded-[2rem] p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">{t("Top promo codes")}</h3>
                <p className="mt-1 text-sm text-slate-500">{t("Most-used discount campaigns right now.")}</p>
              </div>
              <TicketPercent className="h-5 w-5 text-slate-400" />
            </div>
            <div className="mt-6 space-y-3">
              {topPromoCodes.map((promoCode) => (
                <div key={promoCode.id} className="rounded-2xl border border-white/70 bg-white/75 p-4">
                  <div className="flex items-center justify-between gap-4">
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
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="card rounded-[2rem] p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">{t("Upcoming follow-ups")}</h3>
                <p className="mt-1 text-sm text-slate-500">{t("Tasks that need attention soon.")}</p>
              </div>
              <Clock3 className="h-5 w-5 text-slate-400" />
            </div>
          <div className="mt-6 space-y-3">
            {upcomingTasks.map((task) => (
              <div key={task.id} className="rounded-2xl border border-white/70 bg-white/75 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-slate-950">{task.title}</p>
                  <StatusBadge value={task.status} />
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {task.client?.company ?? t("General task")} • {t("Assigned to {name}", { name: task.assignedTo.name })}
                </p>
                <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-400">
                  {t("Due {time}", { time: fromNow(task.dueDate, locale) })}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="card rounded-[2rem] p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">{t("Signals")}</h3>
                <p className="mt-1 text-sm text-slate-500">{t("Quick operating context for the team.")}</p>
              </div>
              <CircleCheckBig className="h-5 w-5 text-slate-400" />
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.75rem] border border-white/75 bg-white/75 p-5">
                <p className="text-sm text-slate-500">{t("Conversion focus")}</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{t("Proposal-heavy")}</p>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {t("Most open volume sits in proposal and negotiation stages, which is ideal for short-cycle momentum.")}
                </p>
              </div>
              <div className="rounded-[1.75rem] border border-white/75 bg-white/75 p-5">
                <p className="text-sm text-slate-500">{t("Promo quality")}</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  {topPromoCodes[0]?.code ?? t("N/A")}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {t("The best-performing code is driving the largest share of recent discount-assisted deals.")}
                </p>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
