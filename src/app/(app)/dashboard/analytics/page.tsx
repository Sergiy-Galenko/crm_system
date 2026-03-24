import { prisma } from "@/lib/db";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { decimalToNumber, formatCurrency, formatNumber } from "@/lib/utils";

export default async function AnalyticsPage() {
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
        eyebrow="Analytics"
        title="Performance analytics"
        description="Understand revenue distribution, source mix, promo effectiveness, and pipeline quality across the CRM."
      />

      <div className="grid gap-4 xl:grid-cols-4">
        <MetricCard label="Won revenue" value={formatCurrency(wonDeals.reduce((sum, deal) => sum + decimalToNumber(deal.netAmount), 0))} meta="Net value from won deals." />
        <MetricCard label="Win rate" value={`${Math.round(winRate)}%`} meta="Leads converted to won." />
        <MetricCard label="Average deal" value={formatCurrency(averageDealSize)} meta="Mean net size of won deals." tone="brand" />
        <MetricCard label="Promo usages" value={formatNumber(promoCodes.reduce((sum, promoCode) => sum + promoCode.usedCount, 0))} meta="Tracked discount applications." />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="card rounded-[2rem] p-5">
          <h3 className="text-lg font-semibold text-slate-950">Lead source mix</h3>
          <p className="mt-1 text-sm text-slate-500">Where top-of-funnel activity is coming from.</p>
          <div className="mt-6 space-y-4">
            {sourceTotals.map((item) => {
              const maxCount = Math.max(...sourceTotals.map((entry) => entry.count), 1);
              return (
                <div key={item.source}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{item.source}</span>
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
          <h3 className="text-lg font-semibold text-slate-950">Deal stage volume</h3>
          <p className="mt-1 text-sm text-slate-500">Pipeline spread across each commercial stage.</p>
          <div className="mt-6 space-y-4">
            {stageTotals.map((item) => (
              <div key={item.stage}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{item.stage.replaceAll("_", " ")}</span>
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
          <h3 className="text-lg font-semibold text-slate-950">Recent promo-code usage</h3>
          <p className="mt-1 text-sm text-slate-500">Who used a promo code, when it happened, and on which account.</p>
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
                  <span>Deal amount {formatCurrency(decimalToNumber(usage.dealAmount))}</span>
                  <span>Discount {formatCurrency(decimalToNumber(usage.discountAmount))}</span>
                  <span>{usage.usedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card rounded-[2rem] p-5">
          <h3 className="text-lg font-semibold text-slate-950">Top-performing promo codes</h3>
          <p className="mt-1 text-sm text-slate-500">Highest-usage codes ranked by applications.</p>
          <div className="mt-6 space-y-3">
            {promoCodes.map((promoCode) => (
              <div key={promoCode.id} className="rounded-[1.75rem] border border-white/75 bg-white/75 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-slate-950">{promoCode.code}</p>
                  <StatusBadge value={promoCode.active ? "ACTIVE" : "INACTIVE"} />
                </div>
                <p className="mt-2 text-sm text-slate-500">{promoCode.description ?? "No description"}</p>
                <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
                  <span>{promoCode.usedCount} usages</span>
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
