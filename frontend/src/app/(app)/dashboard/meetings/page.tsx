import type { UrlObject } from "url";
import Link from "next/link";
import { addMonths, endOfMonth, endOfWeek, format, isValid, parse, startOfMonth, startOfWeek } from "date-fns";
import { MeetingDialog } from "@/components/forms/meeting-dialog";
import { MeetingCalendar } from "@/components/meetings/meeting-calendar";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { clientAccessWhere, meetingAccessWhere, visibleUsersWhere } from "@/lib/crm-scope";
import { prisma } from "@/lib/db";
import { getServerTranslator } from "@/lib/locale-server";
import { requireUser } from "@/lib/session";

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
}: {
  href: UrlObject;
  label: string;
  active?: boolean;
}) {
  return (
    <Button asChild variant={active ? "primary" : "secondary"}>
      <Link href={href}>{label}</Link>
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
      <PageHeader
        eyebrow={t("Calendar")}
        title={t("Meetings")}
        description={t("Keep live calls, demos, and follow-ups in one cleaner schedule view with faster actions and less clutter.")}
        actions={
          <>
            <MonthButton href={createMeetingsMonthHref(prevMonth)} label={t("Previous month")} />
            <MonthButton href={createMeetingsMonthHref(currentMonth)} label={t("Current month")} active={selectedMonthKey === currentMonth} />
            <MonthButton href={createMeetingsMonthHref(nextMonth)} label={t("Next month")} />
            <MeetingDialog users={users} clients={clients} defaults={{ assignedToId: user.id }} triggerLabel="Schedule meeting" />
          </>
        }
      />

      <MeetingCalendar month={selectedMonth} locale={locale} meetings={calendarMeetings} t={t} />
    </div>
  );
}
