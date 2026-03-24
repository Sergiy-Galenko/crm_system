import Link from "next/link";
import { addMonths, endOfMonth, endOfWeek, format, isValid, parse, startOfMonth, startOfWeek } from "date-fns";
import { MeetingDialog } from "@/components/forms/meeting-dialog";
import { MeetingCalendar } from "@/components/meetings/meeting-calendar";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { clientAccessWhere, meetingAccessWhere, visibleUsersWhere } from "@/lib/crm-scope";
import { prisma } from "@/lib/db";
import { getServerTranslator } from "@/lib/locale-server";
import { requireUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";
import { updateMeetingStatusAction } from "@/actions/meetings";

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

export default async function MeetingsPage({ searchParams }: MeetingsPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const selectedMonth = getSelectedMonth(resolvedSearchParams.month);
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const user = await requireUser();
  const { locale, t } = await getServerTranslator();

  const [users, clients, calendarMeetings, monthMeetings, scheduledCount, completedCount, nextMeeting] = await Promise.all([
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
    prisma.meeting.findMany({
      where: {
        ...meetingAccessWhere(user),
        startsAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      include: {
        client: {
          select: {
            id: true,
            company: true,
          },
        },
        assignedTo: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        startsAt: "asc",
      },
    }),
    prisma.meeting.count({
      where: {
        ...meetingAccessWhere(user),
        status: "SCHEDULED",
        startsAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
    }),
    prisma.meeting.count({
      where: {
        ...meetingAccessWhere(user),
        status: "COMPLETED",
        startsAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
    }),
    prisma.meeting.findFirst({
      where: {
        assignedToId: user.id,
        status: "SCHEDULED",
        startsAt: {
          gte: new Date(),
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("Calendar")}
        title={t("Meetings")}
        description={t("Schedule demos, follow-up calls, and account reviews with clear time ownership and status tracking.")}
        actions={<MeetingDialog users={users} clients={clients} defaults={{ assignedToId: user.id }} />}
      />

      <div className="grid gap-4 xl:grid-cols-4">
        <MetricCard label={t("Scheduled this month")} value={String(scheduledCount)} meta={t("Open meetings on the calendar.")} />
        <MetricCard label={t("Completed this month")} value={String(completedCount)} meta={t("Meetings already conducted.")} />
        <MetricCard
          label={t("Month in view")}
          value={formatDate(selectedMonth, locale, "LLLL yyyy")}
          meta={t("Use the calendar controls to move between months.")}
        />
        <MetricCard
          label={t("My next meeting")}
          value={nextMeeting ? formatDate(nextMeeting.startsAt, locale, "MMM d, HH:mm") : t("No upcoming meeting")}
          meta={nextMeeting ? nextMeeting.client.company : t("No meeting is assigned to you yet.")}
          tone="brand"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t("Month navigation")}</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">{formatDate(selectedMonth, locale, "LLLL yyyy")}</h2>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="secondary">
            <Link href={`/dashboard/meetings?month=${prevMonth}`}>{t("Previous month")}</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={`/dashboard/meetings?month=${format(new Date(), "yyyy-MM")}`}>{t("Current month")}</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={`/dashboard/meetings?month=${nextMonth}`}>{t("Next month")}</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <MeetingCalendar month={selectedMonth} locale={locale} meetings={calendarMeetings} t={t} />

        <div className="card rounded-[2rem] p-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">{t("Month agenda")}</h3>
            <p className="mt-1 text-sm text-slate-500">{t("Every meeting scheduled in the selected month with quick status updates.")}</p>
          </div>

          <div className="mt-6 space-y-3">
            {monthMeetings.length ? (
              monthMeetings.map((meeting) => (
                <div key={meeting.id} className="rounded-[1.75rem] border border-white/75 bg-white/80 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-950">{meeting.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        <Link href={`/dashboard/clients/${meeting.client.id}`} className="font-medium text-slate-700">
                          {meeting.client.company}
                        </Link>
                        {" • "}
                        {meeting.assignedTo.name}
                      </p>
                    </div>
                    <StatusBadge value={meeting.status} />
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <p>{formatDate(meeting.startsAt, locale, "MMM d, yyyy • HH:mm")} - {formatDate(meeting.endsAt, locale, "HH:mm")}</p>
                    {meeting.location ? <p>{meeting.location}</p> : null}
                    {meeting.description ? <p>{meeting.description}</p> : null}
                    {meeting.outcome ? <p className="text-slate-500">{meeting.outcome}</p> : null}
                    {meeting.meetingLink ? (
                      <p>
                        <a href={meeting.meetingLink} target="_blank" rel="noreferrer" className="font-medium text-slate-900 underline decoration-slate-300 underline-offset-4">
                          {t("Open meeting link")}
                        </a>
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <MeetingDialog
                      users={users}
                      clients={clients}
                      meeting={{
                        id: meeting.id,
                        title: meeting.title,
                        description: meeting.description,
                        status: meeting.status,
                        startsAt: meeting.startsAt,
                        endsAt: meeting.endsAt,
                        location: meeting.location,
                        meetingLink: meeting.meetingLink,
                        outcome: meeting.outcome,
                        clientId: meeting.clientId,
                        assignedToId: meeting.assignedToId,
                      }}
                      triggerLabel="Edit"
                    />
                    {meeting.status === "SCHEDULED" ? (
                      <>
                        <form action={updateMeetingStatusAction.bind(null, meeting.id, "COMPLETED")}>
                          <Button type="submit" size="sm" variant="secondary">{t("Mark completed")}</Button>
                        </form>
                        <form action={updateMeetingStatusAction.bind(null, meeting.id, "NO_SHOW")}>
                          <Button type="submit" size="sm" variant="subtle">{t("Mark no-show")}</Button>
                        </form>
                        <form action={updateMeetingStatusAction.bind(null, meeting.id, "CANCELED")}>
                          <Button type="submit" size="sm" variant="danger">{t("Cancel meeting")}</Button>
                        </form>
                      </>
                    ) : null}
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-[1.75rem] border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                {t("No meetings are scheduled for this month yet.")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
