import { prisma } from "@/lib/db";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getServerTranslator } from "@/lib/locale-server";
import { decimalToNumber, formatCurrency, formatNumber } from "@/lib/utils";

export default async function AnalyticsPage() {
  const { locale, t } = await getServerTranslator();
  const [deals, leads, promoCodes, promoUsages] = await Promise.all([
    prisma.deal.findMany({
      include: {
        client: {
          select: {
            company: true,
          },
        },
      },
    }),
    prisma.lead.findMany(),
    prisma.promoCode.findMany({
      orderBy: {
        usedCount: "desc",
      },
      take: 5,
    }),
    prisma.promoCodeUsage.findMany({
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

  const wonDeals = deals.filter((deal) => deal.stage === "WON");
  const averageDealSize = wonDeals.length
    ? wonDeals.reduce((sum, deal) => sum + decimalToNumber(deal.netAmount), 0) / wonDeals.length
    : 0;
  const winRate = leads.length ? (leads.filter((lead) => lead.status === "WON").length / leads.length) * 100 : 0;

  const sourceTotals = (["WEBSITE", "REFERRAL", "OUTBOUND", "PARTNER", "EVENT"] as const).map((source) => {
    const count = leads.filter((lead) => lead.source === source).length;
    return { source, count };
  });

  const stageTotals = (["DISCOVERY", "PROPOSAL", "NEGOTIATION", "WON", "LOST"] as const).map((stage) => {
    const count = deals.filter((deal) => deal.stage === stage).length;
    return { stage, count };
  });
  const maxStageCount = Math.max(...stageTotals.map((item) => item.count), 1);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("Analytics")}
        title={t("Performance analytics")}
        description={t("Understand revenue distribution, source mix, promo effectiveness, and pipeline quality across the CRM.")}
      />

      <div className="grid gap-4 xl:grid-cols-4">
        <MetricCard label={t("Won revenue")} value={formatCurrency(wonDeals.reduce((sum, deal) => sum + decimalToNumber(deal.netAmount), 0))} meta={t("Net value from won deals.")} />
        <MetricCard label={t("Win rate")} value={`${Math.round(winRate)}%`} meta={t("Leads converted to won.")} />
        <MetricCard label={t("Average deal")} value={formatCurrency(averageDealSize)} meta={t("Mean net size of won deals.")} tone="brand" />
        <MetricCard label={t("Promo usages")} value={formatNumber(promoCodes.reduce((sum, promoCode) => sum + promoCode.usedCount, 0))} meta={t("Tracked discount applications.")} />
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
                  <span>{t("Deal amount")} {formatCurrency(decimalToNumber(usage.dealAmount))}</span>
                  <span>{t("Discount")} {formatCurrency(decimalToNumber(usage.discountAmount))}</span>
                  <span>{usage.usedAt.toLocaleDateString(locale === "uk" ? "uk-UA" : "en-US", { month: "short", day: "numeric" })}</span>
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
                      : formatCurrency(decimalToNumber(promoCode.discountValue))}
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
