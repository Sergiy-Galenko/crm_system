import { prisma } from "@/lib/db";
import { dealAccessWhere, leadAccessWhere, promoCodeAccessWhere, promoUsageAccessWhere } from "@/lib/crm-scope";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getServerTranslator } from "@/lib/locale-server";
import { requireUser } from "@/lib/session";
import { decimalToNumber, formatCurrency, formatIntlDate, formatNumber } from "@/lib/utils";

const leadSources = ["WEBSITE", "REFERRAL", "OUTBOUND", "PARTNER", "EVENT"] as const;
const dealStages = ["DISCOVERY", "PROPOSAL", "NEGOTIATION", "WON", "LOST"] as const;

export default async function AnalyticsPage() {
  const user = await requireUser();
  const { locale, t } = await getServerTranslator();
  const [
    wonDealStats,
    totalLeads,
    wonLeads,
    leadSourceBreakdown,
    dealStageBreakdown,
    promoUsageStats,
    promoCodes,
    promoUsages,
  ] = await Promise.all([
    prisma.deal.aggregate({
      where: {
        ...dealAccessWhere(user),
        stage: "WON",
      },
      _sum: {
        netAmount: true,
      },
      _avg: {
        netAmount: true,
      },
    }),
    prisma.lead.count({
      where: leadAccessWhere(user),
    }),
    prisma.lead.count({
      where: {
        ...leadAccessWhere(user),
        status: "WON",
      },
    }),
    prisma.lead.groupBy({
      by: ["source"],
      where: leadAccessWhere(user),
      _count: {
        _all: true,
      },
    }),
    prisma.deal.groupBy({
      by: ["stage"],
      where: dealAccessWhere(user),
      _count: {
        _all: true,
      },
    }),
    prisma.promoCode.aggregate({
      where: promoCodeAccessWhere(user),
      _sum: {
        usedCount: true,
      },
    }),
    prisma.promoCode.findMany({
      where: promoCodeAccessWhere(user),
      orderBy: {
        usedCount: "desc",
      },
      take: 5,
    }),
    prisma.promoCodeUsage.findMany({
      where: promoUsageAccessWhere(user),
      orderBy: {
        usedAt: "desc",
      },
      take: 5,
      include: {
        promoCode: {
          select: {
            code: true,
          },
        },
        client: {
          select: {
            company: true,
          },
        },
      },
    }),
  ]);

  const wonRevenue = decimalToNumber(wonDealStats._sum.netAmount ?? 0);
  const averageDealSize = decimalToNumber(wonDealStats._avg.netAmount ?? 0);
  const winRate = totalLeads ? (wonLeads / totalLeads) * 100 : 0;
  const sourceCountByType = new Map(leadSourceBreakdown.map((item) => [item.source, item._count._all]));
  const stageCountByType = new Map(dealStageBreakdown.map((item) => [item.stage, item._count._all]));
  const sourceTotals = leadSources.map((source) => ({
    source,
    count: sourceCountByType.get(source) ?? 0,
  }));
  const stageTotals = dealStages.map((stage) => ({
    stage,
    count: stageCountByType.get(stage) ?? 0,
  }));
  const maxStageCount = Math.max(...stageTotals.map((item) => item.count), 1);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("Analytics")}
        title={t("Performance analytics")}
        description={t("Understand revenue distribution, source mix, promo effectiveness, and pipeline quality across the CRM.")}
      />

      <div className="grid gap-4 xl:grid-cols-4">
        <MetricCard label={t("Won revenue")} value={formatCurrency(wonRevenue, "USD", locale)} meta={t("Net value from won deals.")} />
        <MetricCard label={t("Win rate")} value={`${Math.round(winRate)}%`} meta={t("Leads converted to won.")} />
        <MetricCard label={t("Average deal")} value={formatCurrency(averageDealSize, "USD", locale)} meta={t("Mean net size of won deals.")} tone="brand" />
        <MetricCard label={t("Promo usages")} value={formatNumber(promoUsageStats._sum.usedCount ?? 0, locale)} meta={t("Tracked discount applications.")} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="card rounded-[2rem] p-5">
          <h3 className="text-lg font-semibold text-slate-950">{t("Lead source mix")}</h3>
          <p className="mt-1 text-sm text-slate-500">{t("Where top-of-funnel activity is coming from.")}</p>
          <div className="mt-6 space-y-4">
            {sourceTotals.map((item) => {
              const maxCount = Math.max(...sourceTotals.map((entry) => entry.count), 1);
              return (
                <div key={item.source}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{t(item.source)}</span>
                    <span className="text-slate-500">{item.count}</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100">
                    <div className="h-3 rounded-full bg-blue-500" style={{ width: `${(item.count / maxCount) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card rounded-[2rem] p-5">
          <h3 className="text-lg font-semibold text-slate-950">{t("Deal stage volume")}</h3>
          <p className="mt-1 text-sm text-slate-500">{t("Pipeline spread across each commercial stage.")}</p>
          <div className="mt-6 space-y-4">
            {stageTotals.map((item) => (
              <div key={item.stage}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{t(item.stage)}</span>
                  <span className="text-slate-500">{item.count}</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100">
                  <div className="h-3 rounded-full bg-slate-950" style={{ width: `${(item.count / maxStageCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="card rounded-[2rem] p-5">
          <h3 className="text-lg font-semibold text-slate-950">{t("Recent promo-code usage")}</h3>
          <p className="mt-1 text-sm text-slate-500">{t("Who used a promo code, when it happened, and on which account.")}</p>
          <div className="mt-6 space-y-3">
            {promoUsages.map((usage) => (
              <div key={usage.id} className="rounded-[1.75rem] border border-white/75 bg-white/75 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-950">{usage.promoCode.code}</p>
                    <p className="mt-1 text-sm text-slate-500">{usage.client.company}</p>
                  </div>
                  <StatusBadge value="ACTIVE" />
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                  <span>{t("Deal amount")} {formatCurrency(decimalToNumber(usage.dealAmount), "USD", locale)}</span>
                  <span>{t("Discount")} {formatCurrency(decimalToNumber(usage.discountAmount), "USD", locale)}</span>
                  <span>{formatIntlDate(usage.usedAt, locale, { month: "short", day: "numeric" })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card rounded-[2rem] p-5">
          <h3 className="text-lg font-semibold text-slate-950">{t("Top-performing promo codes")}</h3>
          <p className="mt-1 text-sm text-slate-500">{t("Highest-usage codes ranked by applications.")}</p>
          <div className="mt-6 space-y-3">
            {promoCodes.map((promoCode) => (
              <div key={promoCode.id} className="rounded-[1.75rem] border border-white/75 bg-white/75 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-slate-950">{promoCode.code}</p>
                  <StatusBadge value={promoCode.active ? "ACTIVE" : "INACTIVE"} />
                </div>
                <p className="mt-2 text-sm text-slate-500">{promoCode.description ?? t("No description")}</p>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                  <span>{promoCode.usedCount} {t("usages")}</span>
                  <span>
                    {promoCode.discountType === "PERCENT"
                      ? `${decimalToNumber(promoCode.discountValue)}%`
                      : formatCurrency(decimalToNumber(promoCode.discountValue), "USD", locale)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
