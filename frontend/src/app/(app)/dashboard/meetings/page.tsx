import type { UrlObject } from "url";
import type { ReactNode } from "react";
import Link from "next/link";
import { addMonths, endOfMonth, endOfWeek, format, isValid, parse, startOfMonth, startOfWeek } from "date-fns";
import { ArrowLeft, ArrowRight, CalendarDays } from "lucide-react";
import { MeetingDialog } from "@/components/forms/meeting-dialog";
import { MeetingCalendar } from "@/components/meetings/meeting-calendar";
import { Button } from "@/components/ui/button";
import { clientAccessWhere, meetingAccessWhere, visibleUsersWhere } from "@/lib/crm-scope";
import { prisma } from "@/lib/db";
import { getServerTranslator } from "@/lib/locale-server";
import { requireUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";

type MeetingsPageProps = {
  searchParams?: Promise<{ month?: string }>;
};

function getSelectedMonth(rawMonth: string | undefined) {
  if (!rawMonth) {
    return startOfMonth(new Date());
  }

  const parsedMonth = parse(rawMonth, "yyyy-MM", new Date());
  return isValid(parsedMonth) ? startOfMonth(parsedMonth) : startOfMonth(new Date());
}

function createMeetingsMonthHref(month: string): UrlObject {
  return {
    pathname: "/dashboard/meetings",
    query: { month },
  };
}

function MonthButton({
  href,
  label,
  active = false,
  icon,
}: {
  href: UrlObject;
  label: string;
  active?: boolean;
  icon?: ReactNode;
}) {
  return (
    <Button
      asChild
      variant={active ? "primary" : "secondary"}
      className={active ? "rounded-2xl px-4 shadow-[var(--ui-shadow-soft)]" : "rounded-2xl border-[var(--ui-border-strong)] bg-[var(--ui-surface-solid)] px-4"}
    >
      <Link href={href}>
        {icon}
        {label}
      </Link>
    </Button>
  );
}

export default async function MeetingsPage({ searchParams }: MeetingsPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const selectedMonth = getSelectedMonth(resolvedSearchParams.month);
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const selectedMonthKey = format(selectedMonth, "yyyy-MM");
  const user = await requireUser();
  const { locale, t } = await getServerTranslator();

  const [users, clients, calendarMeetings] = await Promise.all([
    prisma.user.findMany({
      where: visibleUsersWhere(user),
      select: {
        id: true,
        name: true,
        email: true,
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
    prisma.meeting.findMany({
      where: {
        ...meetingAccessWhere(user),
        startsAt: {
          gte: calendarStart,
          lte: calendarEnd,
        },
      },
      include: {
        client: {
          select: {
            company: true,
          },
        },
      },
      orderBy: {
        startsAt: "asc",
      },
    }),
  ]);

  const prevMonth = format(addMonths(selectedMonth, -1), "yyyy-MM");
  const nextMonth = format(addMonths(selectedMonth, 1), "yyyy-MM");
  const currentMonth = format(new Date(), "yyyy-MM");

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2.4rem] border border-[var(--ui-border)] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--ui-surface-solid)_92%,transparent),color-mix(in_srgb,var(--ui-surface-muted)_100%,transparent))] shadow-[var(--ui-shadow-soft)]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-10 top-10 h-32 w-32 rounded-full bg-[color-mix(in_srgb,var(--ui-brand)_10%,transparent)] blur-3xl" />
          <div className="absolute bottom-[-3rem] right-[-2rem] h-44 w-44 rounded-full bg-[color-mix(in_srgb,var(--ui-ring)_55%,transparent)] blur-3xl" />
        </div>

        <div className="relative grid gap-8 px-5 py-6 sm:px-6 sm:py-7 xl:grid-cols-[minmax(0,1fr)_23rem] xl:items-start">
          <div className="max-w-3xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--ui-text-soft)]">{t("Calendar")}</p>
            <h1 className="mt-3 text-[2.65rem] font-semibold tracking-tight text-[var(--ui-text-strong)] sm:text-[3.35rem]">
              {t("Meetings")}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--ui-text-muted)]">
              {t("Keep live calls, demos, and follow-ups in one cleaner schedule view with faster actions and less clutter.")}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] px-4 py-2 text-sm font-medium text-[var(--ui-text)] shadow-[var(--ui-shadow-xs)]">
                <CalendarDays className="h-4 w-4 text-[var(--ui-text-soft)]" />
                <span>{formatDate(selectedMonth, locale, "LLLL yyyy")}</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[color-mix(in_srgb,var(--ui-surface-muted)_92%,transparent)] px-4 py-2 text-sm text-[var(--ui-text-muted)]">
                <span className="inline-block h-2 w-2 rounded-full bg-[var(--ui-brand)]" />
                <span>{t("{count} meetings", { count: calendarMeetings.length })}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[1.9rem] border border-[var(--ui-border)] bg-[color-mix(in_srgb,var(--ui-surface-solid)_86%,transparent)] p-4 shadow-[var(--ui-shadow-xs)] backdrop-blur xl:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--ui-text-soft)]">{t("Month in focus")}</p>
                <p className="mt-2 text-xl font-semibold tracking-tight text-[var(--ui-text-strong)]">
                  {formatDate(selectedMonth, locale, "LLLL yyyy")}
                </p>
              </div>
              <div className="hidden rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-3 py-1 text-xs font-medium text-[var(--ui-text-muted)] sm:inline-flex">
                {t("Calendar overview")}
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2">
              <MonthButton
                href={createMeetingsMonthHref(prevMonth)}
                label={t("Previous month")}
                icon={<ArrowLeft className="h-4 w-4" />}
              />
              <MonthButton
                href={createMeetingsMonthHref(nextMonth)}
                label={t("Next month")}
                icon={<ArrowRight className="h-4 w-4" />}
              />
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <MonthButton href={createMeetingsMonthHref(currentMonth)} label={t("Current month")} active={selectedMonthKey === currentMonth} />
              <MeetingDialog users={users} clients={clients} defaults={{ assignedToId: user.id }} triggerLabel="Schedule meeting" />
            </div>
          </div>
        </div>
      </section>

      <MeetingCalendar month={selectedMonth} locale={locale} meetings={calendarMeetings} t={t} />
    </div>
  );
}
