import type { UrlObject } from "url";
import Link from "next/link";
import { addMonths, endOfMonth, endOfWeek, format, isValid, parse, startOfMonth, startOfWeek } from "date-fns";
import { Building2, CalendarClock, EllipsisVertical, ExternalLink, MapPin, RotateCcw, UserRound } from "lucide-react";
import { deleteMeetingAction, updateMeetingStatusAction } from "@/actions/meetings";
import { MeetingDialog } from "@/components/forms/meeting-dialog";
import { MeetingCalendar } from "@/components/meetings/meeting-calendar";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { UserAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { clientAccessWhere, meetingAccessWhere, visibleUsersWhere } from "@/lib/crm-scope";
import { prisma } from "@/lib/db";
import type { Locale } from "@/lib/locale";
import { getServerTranslator } from "@/lib/locale-server";
import { requireUser } from "@/lib/session";
import { formatDate, fromNow } from "@/lib/utils";

type MeetingsPageProps = {
  searchParams?: Promise<{ month?: string }>;
};

type MeetingUserOption = {
  id: string;
  name: string;
  email: string | null;
  avatarColor: string | null;
  companyLogoUrl: string | null;
};

type ClientOption = {
  id: string;
  company: string;
};

type MeetingListItem = {
  id: string;
  title: string;
  description: string | null;
  status: "SCHEDULED" | "COMPLETED" | "CANCELED" | "NO_SHOW";
  startsAt: Date;
  endsAt: Date;
  location: string | null;
  meetingLink: string | null;
  outcome: string | null;
  clientId: string;
  assignedToId: string;
  client: {
    id: string;
    company: string;
  };
  assignedTo: MeetingUserOption;
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

export default async function MeetingsPage({ searchParams }: MeetingsPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const selectedMonth = getSelectedMonth(resolvedSearchParams.month);
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const user = await requireUser();
  const { locale, t } = await getServerTranslator();
  const now = new Date();

  const [users, clients, calendarMeetings, monthMeetings, completedCount, nextMeeting] = await Promise.all([
    prisma.user.findMany({
      where: visibleUsersWhere(user),
      select: {
        id: true,
        name: true,
        email: true,
        avatarColor: true,
        companyLogoUrl: true,
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
            id: true,
            name: true,
            email: true,
            avatarColor: true,
            companyLogoUrl: true,
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
          gte: now,
        },
      },
      include: {
        client: {
          select: {
            id: true,
            company: true,
          },
        },
      },
      orderBy: {
        startsAt: "asc",
      },
    }),
  ]);

  const upcomingMeetings = monthMeetings.filter((meeting) => meeting.status === "SCHEDULED" && meeting.endsAt >= now);
  const pastMeetings = [...monthMeetings]
    .filter((meeting) => !(meeting.status === "SCHEDULED" && meeting.endsAt >= now))
    .sort((left, right) => right.startsAt.getTime() - left.startsAt.getTime());
  const attentionCount = monthMeetings.filter((meeting) => meeting.status === "SCHEDULED" && meeting.endsAt < now).length;

  const prevMonth = format(addMonths(selectedMonth, -1), "yyyy-MM");
  const nextMonth = format(addMonths(selectedMonth, 1), "yyyy-MM");
  const currentMonth = format(new Date(), "yyyy-MM");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("Calendar")}
        title={t("Meetings")}
        description={t("Keep live calls, demos, and follow-ups in one cleaner schedule view with faster actions and less clutter.")}
        actions={<MeetingDialog users={users} clients={clients} defaults={{ assignedToId: user.id }} triggerLabel="Schedule meeting" />}
      />

      <div className="grid gap-4 xl:grid-cols-4">
        <MetricCard
          label={t("Upcoming this month")}
          value={String(upcomingMeetings.length)}
          meta={t("Scheduled meetings that still need to happen.")}
        />
        <MetricCard
          label={t("Needs follow-up")}
          value={String(attentionCount)}
          meta={t("Scheduled meetings whose time has passed without a final status.")}
        />
        <MetricCard
          label={t("Completed this month")}
          value={String(completedCount)}
          meta={t("Meetings that were already wrapped up.")}
        />
        <MetricCard
          label={t("My next meeting")}
          value={nextMeeting ? formatDate(nextMeeting.startsAt, locale, "MMM d, HH:mm") : t("No upcoming meeting")}
          meta={nextMeeting ? nextMeeting.client.company : t("No meeting is assigned to you yet.")}
          tone="brand"
        />
      </div>

      <div className="card flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">{t("Month in focus")}</p>
          <h2 className="mt-2 text-[2rem] font-semibold tracking-tight text-slate-950">{formatDate(selectedMonth, locale, "LLLL yyyy")}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {t("Use the month switcher to review upcoming commitments, wrapped calls, and schedule density at a glance.")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="secondary">
            <Link href={createMeetingsMonthHref(prevMonth)}>{t("Previous month")}</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={createMeetingsMonthHref(currentMonth)}>{t("Current month")}</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={createMeetingsMonthHref(nextMonth)}>{t("Next month")}</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_22.5rem]">
        <div className="space-y-6">
          <section className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">{t("Upcoming meetings")}</h3>
                <p className="mt-1 text-sm text-slate-500">{t("The next scheduled calls and demos in the current month.")}</p>
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                {t("{count} scheduled", { count: upcomingMeetings.length })}
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {upcomingMeetings.length ? (
                upcomingMeetings.map((meeting) => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    users={users}
                    clients={clients}
                    locale={locale}
                    t={t}
                    upcoming
                  />
                ))
              ) : (
                <SectionEmptyState
                  title={t("No upcoming meetings in this month")}
                  description={t("Your forward-looking schedule is clear here for now. Add a new meeting or move to another month.")}
                />
              )}
            </div>
          </section>

          <section className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">{t("Past and resolved")}</h3>
                <p className="mt-1 text-sm text-slate-500">{t("Everything already handled, canceled, missed, or left without a final follow-up.")}</p>
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                {t("{count} meetings", { count: pastMeetings.length })}
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {pastMeetings.length ? (
                pastMeetings.map((meeting) => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    users={users}
                    clients={clients}
                    locale={locale}
                    t={t}
                  />
                ))
              ) : (
                <SectionEmptyState
                  title={t("No past meetings here yet")}
                  description={t("Completed, canceled, and older meetings will collect here once the month starts filling up.")}
                />
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">{t("Next focus")}</p>
            {nextMeeting ? (
              <>
                <h3 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">{nextMeeting.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {nextMeeting.description || t("Your nearest scheduled client conversation is ready here with quick join and reschedule actions.")}
                </p>
                <div className="mt-5 space-y-3 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    <CalendarClock className="h-4 w-4 text-slate-400" />
                    <span>{formatDate(nextMeeting.startsAt, locale, "MMM d, yyyy • HH:mm")} - {formatDate(nextMeeting.endsAt, locale, "HH:mm")}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-700">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <Link href={`/dashboard/clients/${nextMeeting.client.id}`} className="font-medium text-slate-900 transition hover:text-slate-700">
                      {nextMeeting.client.company}
                    </Link>
                  </div>
                  {nextMeeting.location ? (
                    <div className="flex items-center gap-3 text-sm text-slate-700">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span>{nextMeeting.location}</span>
                    </div>
                  ) : null}
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {nextMeeting.meetingLink ? (
                    <Button asChild size="sm">
                      <a href={nextMeeting.meetingLink} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        {t("Join meeting")}
                      </a>
                    </Button>
                  ) : null}
                  <MeetingDialog
                    users={users}
                    clients={clients}
                    meeting={nextMeeting}
                    triggerLabel="Reschedule"
                  />
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/dashboard/clients/${nextMeeting.client.id}`}>{t("Open client")}</Link>
                  </Button>
                </div>
              </>
            ) : (
              <SectionEmptyState
                title={t("No upcoming meeting")}
                description={t("Nothing is assigned to your schedule yet. Create the next call, demo, or review from here.")}
                action={(
                  <MeetingDialog users={users} clients={clients} defaults={{ assignedToId: user.id }} triggerLabel="Schedule meeting" />
                )}
                compact
              />
            )}
          </section>

          <MeetingCalendar month={selectedMonth} locale={locale} meetings={calendarMeetings} t={t} />
        </div>
      </div>
    </div>
  );
}

function MeetingCard({
  meeting,
  users,
  clients,
  locale,
  t,
  upcoming = false,
}: {
  meeting: MeetingListItem;
  users: MeetingUserOption[];
  clients: ClientOption[];
  locale: Locale;
  t: (key: string, values?: Record<string, string | number>) => string;
  upcoming?: boolean;
}) {
  const actionLabel = upcoming ? "Reschedule" : "Edit";

  return (
    <article className="rounded-[1.75rem] border border-slate-200 bg-[var(--ui-surface-solid)] p-4 shadow-[var(--ui-shadow-xs)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge value={meeting.status} />
            {upcoming ? (
              <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-sky-700">
                {t("Upcoming")}
              </span>
            ) : null}
          </div>
          <h3 className="mt-3 text-lg font-semibold text-slate-950">{meeting.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {meeting.description || t("No extra notes were added for this meeting.")}
          </p>
        </div>

        <MeetingActionsMenu meeting={meeting} t={t} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetaBlock
          icon={<CalendarClock className="h-4 w-4" />}
          label={t("Time")}
          value={`${formatDate(meeting.startsAt, locale, "MMM d")} • ${formatDate(meeting.startsAt, locale, "HH:mm")} - ${formatDate(meeting.endsAt, locale, "HH:mm")}`}
          meta={fromNow(meeting.startsAt, locale)}
        />
        <MetaBlock
          icon={<Building2 className="h-4 w-4" />}
          label={t("Client")}
          value={meeting.client.company}
          href={`/dashboard/clients/${meeting.client.id}`}
        />
        <MetaBlock
          icon={<UserRound className="h-4 w-4" />}
          label={t("Assignee")}
          value={meeting.assignedTo.name}
          meta={meeting.assignedTo.email ?? undefined}
          avatar={(
            <UserAvatar
              name={meeting.assignedTo.name}
              color={meeting.assignedTo.avatarColor}
              imageUrl={meeting.assignedTo.companyLogoUrl}
              className="h-9 w-9 rounded-xl"
            />
          )}
        />
        <MetaBlock
          icon={<MapPin className="h-4 w-4" />}
          label={t("Location")}
          value={meeting.location ?? t("No location")}
        />
      </div>

      {meeting.outcome ? (
        <div className="mt-4 rounded-[1.25rem] border border-slate-200 bg-slate-50/70 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{t("Outcome")}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{meeting.outcome}</p>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {meeting.meetingLink ? (
          <Button asChild size="sm" variant={upcoming ? "primary" : "secondary"}>
            <a href={meeting.meetingLink} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
              {t(upcoming ? "Join meeting" : "Open meeting link")}
            </a>
          </Button>
        ) : null}
        <MeetingDialog users={users} clients={clients} meeting={meeting} triggerLabel={actionLabel} />
        <Button asChild variant="ghost" size="sm">
          <Link href={`/dashboard/clients/${meeting.client.id}`}>{t("Open client")}</Link>
        </Button>
        {meeting.status === "SCHEDULED" && !upcoming ? (
          <form action={updateMeetingStatusAction.bind(null, meeting.id, "COMPLETED")}>
            <Button type="submit" variant="secondary" size="sm">
              {t("Mark completed")}
            </Button>
          </form>
        ) : null}
      </div>
    </article>
  );
}

function MeetingActionsMenu({
  meeting,
  t,
}: {
  meeting: MeetingListItem;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="rounded-2xl">
          <EllipsisVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
        <DropdownMenuLabel>{t("Meeting actions")}</DropdownMenuLabel>
        {meeting.status === "SCHEDULED" ? (
          <>
            <form action={updateMeetingStatusAction.bind(null, meeting.id, "COMPLETED")}>
              <MenuActionButton>{t("Mark completed")}</MenuActionButton>
            </form>
            <form action={updateMeetingStatusAction.bind(null, meeting.id, "NO_SHOW")}>
              <MenuActionButton>{t("Mark no-show")}</MenuActionButton>
            </form>
            <form action={updateMeetingStatusAction.bind(null, meeting.id, "CANCELED")}>
              <MenuActionButton>{t("Cancel meeting")}</MenuActionButton>
            </form>
          </>
        ) : (
          <form action={updateMeetingStatusAction.bind(null, meeting.id, "SCHEDULED")}>
            <MenuActionButton>
              <RotateCcw className="h-4 w-4" />
              {t("Move back to scheduled")}
            </MenuActionButton>
          </form>
        )}
        <DropdownMenuSeparator />
        <form action={deleteMeetingAction.bind(null, meeting.id)}>
          <MenuActionButton danger>{t("Delete meeting")}</MenuActionButton>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MenuActionButton({
  children,
  danger = false,
}: {
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="submit"
      className={[
        "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition",
        danger
          ? "text-rose-600 hover:bg-rose-50"
          : "text-slate-700 hover:bg-slate-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function MetaBlock({
  icon,
  label,
  value,
  meta,
  href,
  avatar,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  meta?: string;
  href?: string;
  avatar?: React.ReactNode;
}) {
  const content = (
    <div className="flex items-start gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50/75 px-3 py-3">
      <div className="mt-0.5 shrink-0 text-slate-400">{avatar ?? icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">{label}</p>
        <p className="mt-1 truncate text-sm font-medium text-slate-900">{value}</p>
        {meta ? <p className="mt-1 truncate text-xs text-slate-500">{meta}</p> : null}
      </div>
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href as never} className="transition hover:opacity-90">
      {content}
    </Link>
  );
}

function SectionEmptyState({
  title,
  description,
  action,
  compact = false,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50/65 px-5 text-center ${compact ? "py-8" : "py-10"}`}>
      <p className="text-base font-semibold text-slate-950">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
