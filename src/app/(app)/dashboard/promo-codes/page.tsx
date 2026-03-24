import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { createPageHref, getPage, getParam, type SearchParamsRecord } from "@/lib/query-params";
import { decimalToNumber, formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { PromoCodeDialog } from "@/components/forms/promo-code-dialog";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getServerTranslator } from "@/lib/locale-server";

const pageSize = 8;

type PromoCodesPageProps = {
  searchParams: Promise<SearchParamsRecord>;
};

export default async function PromoCodesPage({ searchParams }: PromoCodesPageProps) {
  const { locale, t } = await getServerTranslator();
  const user = await requireUser();
  const resolvedSearchParams = await searchParams;
  const query = getParam(resolvedSearchParams, "q");
  const status = getParam(resolvedSearchParams, "status");
  const sort = getParam(resolvedSearchParams, "sort") || "usage";
  const page = getPage(resolvedSearchParams);

  const where = {
    ...(query
      ? {
          OR: [
            { code: { contains: query, mode: "insensitive" as const } },
            { description: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(status === "active" ? { active: true } : {}),
    ...(status === "disabled" ? { active: false } : {}),
  };

  const orderBy =
    sort === "expires"
      ? { expiresAt: "asc" as const }
      : sort === "newest"
        ? { createdAt: "desc" as const }
        : { usedCount: "desc" as const };

  const [promoCodes, totalPromoCodes] = await Promise.all([
    prisma.promoCode.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.promoCode.count({ where }),
  ]);

  const pageCount = Math.max(1, Math.ceil(totalPromoCodes / pageSize));
  const prevHref = createPageHref("/dashboard/promo-codes", resolvedSearchParams, { page: String(Math.max(1, page - 1)) });
  const nextHref = createPageHref("/dashboard/promo-codes", resolvedSearchParams, { page: String(Math.min(pageCount, page + 1)) });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("Discount engine")}
        title={t("Promo codes")}
        description={t("Track usage limits, expiry windows, server-validated application, and who used each promo on a deal.")}
        actions={user.role === "ADMIN" ? <PromoCodeDialog /> : null}
      />

      <div className="card rounded-[2rem] p-5">
        <form className="grid gap-3 md:grid-cols-[1fr_220px_220px]">
          <Input name="q" defaultValue={query} placeholder={t("Search code or description")} />
          <Select name="status" defaultValue={status}>
            <option value="">{t("All codes")}</option>
            <option value="active">{t("Active")}</option>
            <option value="disabled">{t("Disabled")}</option>
          </Select>
          <Select name="sort" defaultValue={sort}>
            <option value="usage">{t("Most used")}</option>
            <option value="expires">{t("Nearest expiry")}</option>
            <option value="newest">{t("Newest first")}</option>
          </Select>
        </form>
      </div>

      {promoCodes.length ? (
        <div className="card overflow-hidden rounded-[2rem] p-2">
          <div className="scrollbar-subtle overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>{t("Code")}</TableHeaderCell>
                  <TableHeaderCell>{t("Discount")}</TableHeaderCell>
                  <TableHeaderCell>{t("Status")}</TableHeaderCell>
                  <TableHeaderCell>{t("Usage")}</TableHeaderCell>
                  <TableHeaderCell>{t("Expires")}</TableHeaderCell>
                  <TableHeaderCell>{t("Owner")}</TableHeaderCell>
                  {user.role === "ADMIN" ? <TableHeaderCell className="text-right">{t("Actions")}</TableHeaderCell> : null}
                </TableRow>
              </TableHead>
              <TableBody>
                {promoCodes.map((promoCode) => (
                  <TableRow key={promoCode.id}>
                    <TableCell>
                      <p className="font-medium text-slate-950">{promoCode.code}</p>
                      <div className="mt-1 text-xs text-slate-500">{promoCode.description ?? t("No description")}</div>
                    </TableCell>
                    <TableCell>
                      {promoCode.discountType === "PERCENT"
                        ? `${decimalToNumber(promoCode.discountValue)}%`
                        : formatCurrency(decimalToNumber(promoCode.discountValue))}
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={promoCode.active ? "ACTIVE" : "INACTIVE"} />
                    </TableCell>
                    <TableCell>
                      {promoCode.usedCount}
                      {promoCode.usageLimit ? ` / ${promoCode.usageLimit}` : ` / ${t("unlimited")}`}
                    </TableCell>
                    <TableCell>{promoCode.expiresAt ? formatDate(promoCode.expiresAt, locale) : t("No expiry")}</TableCell>
                    <TableCell>{promoCode.createdBy.name}</TableCell>
                    {user.role === "ADMIN" ? (
                      <TableCell className="text-right">
                        <PromoCodeDialog
                          promoCode={{
                            id: promoCode.id,
                            code: promoCode.code,
                            description: promoCode.description,
                            active: promoCode.active,
                            expiresAt: promoCode.expiresAt,
                            usageLimit: promoCode.usageLimit,
                            discountType: promoCode.discountType,
                            discountValue: decimalToNumber(promoCode.discountValue),
                          }}
                          triggerLabel="Edit"
                        />
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <EmptyState
          title={t("No promo codes matched your filters")}
          description={t("Try a broader search or create a new code if you are signed in as an admin.")}
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
