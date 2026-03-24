import Link from "next/link";
import { ArrowRight, CircleCheckBig, Clock3, Sparkles, TicketPercent } from "lucide-react";
import { ActivityFeed } from "@/components/activity-feed";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { decimalToNumber, formatCurrency, formatNumber, fromNow } from "@/lib/utils";

export default async function DashboardPage() {
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
    prisma.lead.count(),
    prisma.client.count(),
    prisma.deal.count(),
    prisma.deal.aggregate({
      where: { stage: "WON" },
      _sum: { netAmount: true },
    }),
    prisma.promoCode.aggregate({
      _sum: {
        usedCount: true,
      },
      _count: {
        _all: true,
      },
    }),
    prisma.activityLog.findMany({
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
      _count: {
        _all: true,
      },
      orderBy: {
        stage: "asc",
      },
    }),
    prisma.task.findMany({
      where: {
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
        eyebrow="Overview"
        title="Revenue operations at a glance"
        description="Track account momentum, pipeline health, promo-code performance, and follow-up workload from a single dashboard."
        actions={
          <Button asChild>
            <Link href="/dashboard/deals">
              Open deals
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-5">
        <MetricCard label="Leads" value={formatNumber(leadsCount)} meta="Active inbound and outbound opportunities." />
        <MetricCard label="Clients" value={formatNumber(clientsCount)} meta="Accounts under active management." />
        <MetricCard label="Deals" value={formatNumber(dealsCount)} meta="Full pipeline including won and lost." />
        <MetricCard
          label="Revenue"
          value={formatCurrency(revenueValue)}
          meta="Net value from won deals."
          tone="brand"
        />
        <MetricCard
          label="Promo usage"
          value={formatNumber(promoUsageAggregate._sum.usedCount ?? 0)}
          meta={`${promoUsageAggregate._count._all} total promo codes in the library.`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <ActivityFeed items={recentActivity} />

        <div className="space-y-6">
          <div className="card rounded-[2rem] p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Pipeline distribution</h3>
                <p className="mt-1 text-sm text-slate-500">Where current deal volume is concentrated.</p>
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
                      <span className="font-medium text-slate-700">{stage.replaceAll("_", " ")}</span>
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
                <h3 className="text-lg font-semibold text-slate-950">Top promo codes</h3>
                <p className="mt-1 text-sm text-slate-500">Most-used discount campaigns right now.</p>
              </div>
              <TicketPercent className="h-5 w-5 text-slate-400" />
            </div>
            <div className="mt-6 space-y-3">
              {topPromoCodes.map((promoCode) => (
                <div key={promoCode.id} className="rounded-2xl border border-white/70 bg-white/75 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-950">{promoCode.code}</p>
                      <p className="mt-1 text-sm text-slate-500">{promoCode.description ?? "No description added."}</p>
                    </div>
                    <StatusBadge value={promoCode.active ? "ACTIVE" : "INACTIVE"} />
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                    <span>{promoCode.usedCount} usages</span>
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
              <h3 className="text-lg font-semibold text-slate-950">Upcoming follow-ups</h3>
              <p className="mt-1 text-sm text-slate-500">Tasks that need attention soon.</p>
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
                  {task.client?.company ?? "General task"} • assigned to {task.assignedTo.name}
                </p>
                <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-400">
                  Due {fromNow(task.dueDate)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="card rounded-[2rem] p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Signals</h3>
              <p className="mt-1 text-sm text-slate-500">Quick operating context for the team.</p>
            </div>
            <CircleCheckBig className="h-5 w-5 text-slate-400" />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.75rem] border border-white/75 bg-white/75 p-5">
              <p className="text-sm text-slate-500">Conversion focus</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Proposal-heavy</p>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Most open volume sits in proposal and negotiation stages, which is ideal for short-cycle momentum.
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-white/75 bg-white/75 p-5">
              <p className="text-sm text-slate-500">Promo quality</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                {topPromoCodes[0]?.code ?? "N/A"}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                The best-performing code is driving the largest share of recent discount-assisted deals.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
