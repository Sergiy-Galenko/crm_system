import { prisma } from "@/lib/db";
import { createPageHref, getPage, getParam, type SearchParamsRecord } from "@/lib/query-params";
import { decimalToNumber, formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { LeadDialog } from "@/components/forms/lead-dialog";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getServerTranslator } from "@/lib/locale-server";

const pageSize = 8;

type LeadsPageProps = {
  searchParams: Promise<SearchParamsRecord>;
};

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const { locale, t } = await getServerTranslator();
  const resolvedSearchParams = await searchParams;
  const query = getParam(resolvedSearchParams, "q");
  const status = getParam(resolvedSearchParams, "status");
  const sort = getParam(resolvedSearchParams, "sort") || "newest";
  const page = getPage(resolvedSearchParams);

  const where = {
    ...(query
      ? {
          OR: [
            { company: { contains: query, mode: "insensitive" as const } },
            { name: { contains: query, mode: "insensitive" as const } },
            { email: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(status ? { status: status as "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL" | "WON" | "LOST" } : {}),
  };

  const orderBy =
    sort === "value"
      ? { estimatedValue: "desc" as const }
      : sort === "follow-up"
        ? { nextFollowUpAt: "asc" as const }
        : { createdAt: "desc" as const };

  const [leads, totalLeads, users, clients] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        owner: {
          select: {
            name: true,
          },
        },
        client: {
          select: {
            company: true,
          },
        },
      },
    }),
    prisma.lead.count({ where }),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    prisma.client.findMany({
      select: {
        id: true,
        company: true,
      },
      orderBy: {
        company: "asc",
      },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(totalLeads / pageSize));
  const prevHref = createPageHref("/dashboard/leads", resolvedSearchParams, { page: String(Math.max(1, page - 1)) });
  const nextHref = createPageHref("/dashboard/leads", resolvedSearchParams, { page: String(Math.min(pageCount, page + 1)) });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("Prospecting")}
        title={t("Leads")}
        description={t("Qualify new opportunities, monitor next follow-ups, and connect prospects to account records as they mature.")}
        actions={<LeadDialog users={users} clients={clients} />}
      />

      <div className="card rounded-[2rem] p-5">
        <form className="grid gap-3 md:grid-cols-[1fr_220px_220px]">
          <Input name="q" defaultValue={query} placeholder={t("Search company, lead, or email")} />
          <Select name="status" defaultValue={status}>
            <option value="">{t("All statuses")}</option>
            <option value="NEW">{t("New")}</option>
            <option value="CONTACTED">{t("Contacted")}</option>
            <option value="QUALIFIED">{t("Qualified")}</option>
            <option value="PROPOSAL">{t("Proposal")}</option>
            <option value="WON">{t("Won")}</option>
            <option value="LOST">{t("Lost")}</option>
          </Select>
          <Select name="sort" defaultValue={sort}>
            <option value="newest">{t("Newest first")}</option>
            <option value="value">{t("Highest estimated value")}</option>
            <option value="follow-up">{t("Nearest follow-up")}</option>
          </Select>
        </form>
      </div>

      {leads.length ? (
        <div className="card overflow-hidden rounded-[2rem] p-2">
          <div className="scrollbar-subtle overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>{t("Lead")}</TableHeaderCell>
                  <TableHeaderCell>{t("Source")}</TableHeaderCell>
                  <TableHeaderCell>{t("Status")}</TableHeaderCell>
                  <TableHeaderCell>{t("Estimated value")}</TableHeaderCell>
                  <TableHeaderCell>{t("Owner")}</TableHeaderCell>
                  <TableHeaderCell>{t("Follow-up")}</TableHeaderCell>
                  <TableHeaderCell className="text-right">{t("Actions")}</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <p className="font-medium text-slate-950">{lead.company}</p>
                      <div className="mt-1 text-xs text-slate-500">
                        {lead.name} • {lead.email}
                      </div>
                    </TableCell>
                    <TableCell>{t(lead.source)}</TableCell>
                    <TableCell>
                      <StatusBadge value={lead.status} />
                    </TableCell>
                    <TableCell>{formatCurrency(decimalToNumber(lead.estimatedValue))}</TableCell>
                    <TableCell>{lead.owner.name}</TableCell>
                    <TableCell>{lead.nextFollowUpAt ? formatDate(lead.nextFollowUpAt, locale) : t("Not scheduled")}</TableCell>
                    <TableCell className="text-right">
                      <LeadDialog
                        users={users}
                        clients={clients}
                        lead={{
                          id: lead.id,
                          name: lead.name,
                          company: lead.company,
                          email: lead.email,
                          phone: lead.phone,
                          source: lead.source,
                          status: lead.status,
                          estimatedValue: decimalToNumber(lead.estimatedValue),
                          ownerId: lead.ownerId,
                          clientId: lead.clientId,
                          nextFollowUpAt: lead.nextFollowUpAt,
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
          title={t("No leads matched your filters")}
          description={t("Refine your filters or add a new lead to get the prospecting pipeline moving.")}
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
