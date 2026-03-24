import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getPage, getParam, createPageHref, type SearchParamsRecord } from "@/lib/query-params";
import { decimalToNumber, formatCurrency, fromNow } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { ClientDialog } from "@/components/forms/client-dialog";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { clientAccessWhere, visibleUsersWhere } from "@/lib/crm-scope";
import { getServerTranslator } from "@/lib/locale-server";
import { requireUser } from "@/lib/session";

const pageSize = 8;

type ClientsPageProps = {
  searchParams: Promise<SearchParamsRecord>;
};

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const user = await requireUser();
  const { locale, t } = await getServerTranslator();
  const resolvedSearchParams = await searchParams;
  const query = getParam(resolvedSearchParams, "q");
  const status = getParam(resolvedSearchParams, "status");
  const sort = getParam(resolvedSearchParams, "sort") || "newest";
  const page = getPage(resolvedSearchParams);

  const where: Prisma.ClientWhereInput = {
    ...clientAccessWhere(user),
    ...(query
      ? {
          OR: [
            { company: { contains: query, mode: "insensitive" as const } },
            { name: { contains: query, mode: "insensitive" as const } },
            { email: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(status ? { status: status as "ACTIVE" | "AT_RISK" | "INACTIVE" } : {}),
  };

  const orderBy =
    sort === "revenue"
      ? { totalRevenue: "desc" as const }
      : sort === "monthly"
        ? { monthlyValue: "desc" as const }
        : sort === "company"
          ? { company: "asc" as const }
          : { createdAt: "desc" as const };

  const [clients, totalClients, users] = await Promise.all([
    prisma.client.findMany({
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
        _count: {
          select: {
            deals: true,
            tasks: true,
          },
        },
      },
    }),
    prisma.client.count({ where }),
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
  ]);

  const pageCount = Math.max(1, Math.ceil(totalClients / pageSize));
  const prevHref = createPageHref("/dashboard/clients", resolvedSearchParams, { page: String(Math.max(1, page - 1)) });
  const nextHref = createPageHref("/dashboard/clients", resolvedSearchParams, { page: String(Math.min(pageCount, page + 1)) });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("CRM")}
        title={t("Clients")}
        description={t("Manage active accounts, ownership, health status, and commercial value with a clean operating view.")}
        actions={<ClientDialog users={users} />}
      />

      <div className="card rounded-[2rem] p-5">
        <form className="grid gap-3 md:grid-cols-[1fr_220px_220px]">
          <Input name="q" defaultValue={query} placeholder={t("Search company, contact, or email")} />
          <Select name="status" defaultValue={status}>
            <option value="">{t("All statuses")}</option>
            <option value="ACTIVE">{t("Active")}</option>
            <option value="AT_RISK">{t("At risk")}</option>
            <option value="INACTIVE">{t("Inactive")}</option>
          </Select>
          <Select name="sort" defaultValue={sort}>
            <option value="newest">{t("Newest first")}</option>
            <option value="revenue">{t("Highest revenue")}</option>
            <option value="monthly">{t("Highest monthly value")}</option>
            <option value="company">{t("Company A-Z")}</option>
          </Select>
        </form>
      </div>

      {clients.length ? (
        <div className="card overflow-hidden rounded-[2rem] p-2">
          <div className="scrollbar-subtle overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>{t("Company")}</TableHeaderCell>
                  <TableHeaderCell>{t("Owner")}</TableHeaderCell>
                  <TableHeaderCell>{t("Status")}</TableHeaderCell>
                  <TableHeaderCell>{t("Value")}</TableHeaderCell>
                  <TableHeaderCell>{t("Open work")}</TableHeaderCell>
                  <TableHeaderCell>{t("Last contact")}</TableHeaderCell>
                  <TableHeaderCell className="text-right">{t("Actions")}</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <Link href={`/dashboard/clients/${client.id}`} className="font-medium text-slate-950">
                        {client.company}
                      </Link>
                      <div className="mt-1 text-xs text-slate-500">
                        {client.name} • {client.email}
                      </div>
                    </TableCell>
                    <TableCell>{client.owner.name}</TableCell>
                    <TableCell>
                      <StatusBadge value={client.status} />
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-slate-950">{formatCurrency(decimalToNumber(client.monthlyValue))}/mo</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatCurrency(decimalToNumber(client.totalRevenue))} {t("total")}
                      </p>
                    </TableCell>
                    <TableCell>
                      {client._count.deals} {t("deals")} • {client._count.tasks} {t("tasks")}
                    </TableCell>
                    <TableCell>
                      {client.lastContactAt ? fromNow(client.lastContactAt, locale) : t("No activity")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="secondary">
                          <Link href={`/dashboard/clients/${client.id}`}>{t("View")}</Link>
                        </Button>
                        <ClientDialog
                          users={users}
                          client={{
                            id: client.id,
                            name: client.name,
                            company: client.company,
                            email: client.email,
                            phone: client.phone,
                            status: client.status,
                            segment: client.segment,
                            location: client.location,
                            monthlyValue: decimalToNumber(client.monthlyValue),
                            ownerId: client.ownerId,
                          }}
                          triggerLabel="Edit"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <EmptyState
          title={t("No clients matched your filters")}
          description={t("Adjust your search or status filters, or create a new client record to start building the account list.")}
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
