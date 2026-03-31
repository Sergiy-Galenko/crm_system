import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createPageHref, getPage, getParam, type SearchParamsRecord } from "@/lib/query-params";
import { decimalToNumber, formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { DealDialog } from "@/components/forms/deal-dialog";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { clientAccessWhere, dealAccessWhere, leadAccessWhere, visibleUsersWhere } from "@/lib/crm-scope";
import { getServerTranslator } from "@/lib/locale-server";
import { requireUser } from "@/lib/session";

const pageSize = 8;

type DealsPageProps = {
  searchParams: Promise<SearchParamsRecord>;
};

export default async function DealsPage({ searchParams }: DealsPageProps) {
  const user = await requireUser();
  const { locale, t } = await getServerTranslator();
  const resolvedSearchParams = await searchParams;
  const query = getParam(resolvedSearchParams, "q");
  const stage = getParam(resolvedSearchParams, "stage");
  const sort = getParam(resolvedSearchParams, "sort") || "close-date";
  const page = getPage(resolvedSearchParams);

  const where: Prisma.DealWhereInput = {
    ...dealAccessWhere(user),
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" as const } },
            { client: { company: { contains: query, mode: "insensitive" as const } } },
          ],
        }
      : {}),
    ...(stage ? { stage: stage as "DISCOVERY" | "PROPOSAL" | "NEGOTIATION" | "WON" | "LOST" } : {}),
  };

  const orderBy =
    sort === "value"
      ? { netAmount: "desc" as const }
      : sort === "newest"
        ? { createdAt: "desc" as const }
        : { closeDate: "asc" as const };

  const [deals, totalDeals, users, clients, leads] = await Promise.all([
    prisma.deal.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        client: {
          select: {
            company: true,
          },
        },
        owner: {
          select: {
            name: true,
          },
        },
        promoCode: {
          select: {
            code: true,
          },
        },
      },
    }),
    prisma.deal.count({ where }),
    prisma.user.findMany({
      where: visibleUsersWhere(user),
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.client.findMany({
      where: clientAccessWhere(user),
      select: {
        id: true,
        company: true,
      },
      orderBy: {
        company: "asc",
      },
    }),
    prisma.lead.findMany({
      where: leadAccessWhere(user),
      select: {
        id: true,
        company: true,
      },
      orderBy: {
        company: "asc",
      },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(totalDeals / pageSize));
  const prevHref = createPageHref("/dashboard/deals", resolvedSearchParams, { page: String(Math.max(1, page - 1)) });
  const nextHref = createPageHref("/dashboard/deals", resolvedSearchParams, { page: String(Math.min(pageCount, page + 1)) });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("Pipeline")}
        title={t("Deals")}
        description={t("Manage stage transitions, gross-to-net revenue, promo adjustments, and close timing in one commercial pipeline.")}
        actions={<DealDialog users={users} clients={clients} leads={leads} />}
      />

      <div className="card rounded-[2rem] p-5">
        <form className="grid gap-3 md:grid-cols-[1fr_220px_220px]">
          <Input name="q" defaultValue={query} placeholder={t("Search deal title or client company")} />
          <Select name="stage" defaultValue={stage}>
            <option value="">{t("All stages")}</option>
            <option value="DISCOVERY">{t("Discovery")}</option>
            <option value="PROPOSAL">{t("Proposal")}</option>
            <option value="NEGOTIATION">{t("Negotiation")}</option>
            <option value="WON">{t("Won")}</option>
            <option value="LOST">{t("Lost")}</option>
          </Select>
          <Select name="sort" defaultValue={sort}>
            <option value="close-date">{t("Nearest close date")}</option>
            <option value="value">{t("Highest net value")}</option>
            <option value="newest">{t("Newest first")}</option>
          </Select>
        </form>
      </div>

      {deals.length ? (
        <div className="card overflow-hidden rounded-[2rem] p-2">
          <div className="scrollbar-subtle overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>{t("Deal")}</TableHeaderCell>
                  <TableHeaderCell>{t("Stage")}</TableHeaderCell>
                  <TableHeaderCell>{t("Values")}</TableHeaderCell>
                  <TableHeaderCell>{t("Promo")}</TableHeaderCell>
                  <TableHeaderCell>{t("Owner")}</TableHeaderCell>
                  <TableHeaderCell>{t("Close date")}</TableHeaderCell>
                  <TableHeaderCell className="text-right">{t("Actions")}</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {deals.map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell>
                      <p className="font-medium text-slate-950">{deal.title}</p>
                      <div className="mt-1 text-xs text-slate-500">{deal.client.company}</div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={deal.stage} />
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-slate-950">{formatCurrency(decimalToNumber(deal.netAmount), deal.currency, locale)}</p>
                      <div className="mt-1 text-xs text-slate-500">
                        {t("Gross")} {formatCurrency(decimalToNumber(deal.grossAmount), deal.currency, locale)} • {t("Discount")}{" "}
                        {formatCurrency(decimalToNumber(deal.discountAmount), deal.currency, locale)}
                      </div>
                    </TableCell>
                    <TableCell>{deal.promoCode?.code ?? t("No promo")}</TableCell>
                    <TableCell>{deal.owner.name}</TableCell>
                    <TableCell>{deal.closeDate ? formatDate(deal.closeDate, locale) : t("No close date")}</TableCell>
                    <TableCell className="text-right">
                      <DealDialog
                        users={users}
                        clients={clients}
                        leads={leads}
                        deal={{
                          id: deal.id,
                          title: deal.title,
                          description: deal.description,
                          stage: deal.stage,
                          currency: deal.currency,
                          grossAmount: decimalToNumber(deal.grossAmount),
                          closeDate: deal.closeDate,
                          clientId: deal.clientId,
                          leadId: deal.leadId,
                          ownerId: deal.ownerId,
                          promoCode: deal.promoCode?.code ?? "",
                        }}
                        triggerLabel="Edit"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <EmptyState
          title={t("No deals matched your filters")}
          description={t("Broaden the search or create a new deal to populate the pipeline.")}
        />
      )}

      <Pagination
        page={page}
        pageCount={pageCount}
        prevHref={prevHref}
        nextHref={nextHref}
      />
    </div>
  );
}
