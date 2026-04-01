import type { UrlObject } from "url";
import Link from "next/link";
import { addWeeks, eachDayOfInterval, endOfWeek, format, isSameDay, isToday, isValid, parse, startOfWeek } from "date-fns";
import { ArrowLeft, ArrowRight, CalendarDays } from "lucide-react";
import { MeetingDialog } from "@/components/forms/meeting-dialog";
import { MeetingScheduleBoard } from "@/components/meetings/meeting-schedule-board";
import { Button } from "@/components/ui/button";
import { clientAccessWhere, meetingAccessWhere, visibleUsersWhere } from "@/lib/crm-scope";
import { prisma } from "@/lib/db";
import { getServerTranslator } from "@/lib/locale-server";
import { requireUser } from "@/lib/session";
import { formatDate } from "@/lib/utils";

type MeetingsPageProps = {
  searchParams?: Promise<{ week?: string }>;
};

function getSelectedWeek(rawWeek: string | undefined) {
  if (!rawWeek) {
    return startOfWeek(new Date(), { weekStartsOn: 1 });
  }

  const parsedWeek = parse(rawWeek, "yyyy-MM-dd", new Date());
  return isValid(parsedWeek) ? startOfWeek(parsedWeek, { weekStartsOn: 1 }) : startOfWeek(new Date(), { weekStartsOn: 1 });
}

function createMeetingsWeekHref(week: string): UrlObject {
  return {
    pathname: "/dashboard/meetings",
    query: { week },
  };
}

function WeekButton({
  href,
  label,
  active = false,
  icon,
  className,
}: {
  href: UrlObject;
  label: string;
  active?: boolean;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <Button
      asChild
      variant={active ? "primary" : "secondary"}
      className={[
        "h-auto min-h-14 w-full justify-start gap-3 whitespace-normal rounded-2xl px-4 py-3 text-left leading-5",
        active
          ? "shadow-[var(--ui-shadow-soft)]"
          : "border-[var(--ui-border-strong)] bg-[var(--ui-surface-solid)]",
        className ?? "",
      ].join(" ")}
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
  const selectedWeekStart = getSelectedWeek(resolvedSearchParams.week);
  const selectedWeekEnd = endOfWeek(selectedWeekStart, { weekStartsOn: 1 });
  const selectedWeekKey = format(selectedWeekStart, "yyyy-MM-dd");
  const user = await requireUser();
  const { locale, t } = await getServerTranslator();

  const [users, clients, meetings] = await Promise.all([
    prisma.user.findMany({
      where: visibleUsersWhere(user),
      select: {
        id: true,
        name: true,
        email: true,
        nickname: true,
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
          gte: selectedWeekStart,
          lte: selectedWeekEnd,
        },
      },
      orderBy: {
        startsAt: "asc",
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
            nickname: true,
            avatarColor: true,
            companyLogoUrl: true,
          },
        },
        comments: {
          orderBy: {
            createdAt: "asc",
          },
          select: {
            id: true,
            body: true,
            createdAt: true,
            editedAt: true,
            mentionUserIds: true,
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                nickname: true,
                avatarColor: true,
                companyLogoUrl: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const prevWeek = format(addWeeks(selectedWeekStart, -1), "yyyy-MM-dd");
  const nextWeek = format(addWeeks(selectedWeekStart, 1), "yyyy-MM-dd");
  const currentWeek = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  const days = eachDayOfInterval({
    start: selectedWeekStart,
    end: selectedWeekEnd,
  }).map((day) => ({
    key: format(day, "yyyy-MM-dd"),
    label: formatDate(day, locale, "EEEE"),
    shortDateLabel: formatDate(day, locale, "d MMM"),
    isToday: isToday(day),
    meetings: meetings
      .filter((meeting) => isSameDay(meeting.startsAt, day))
      .map((meeting) => ({
        id: meeting.id,
        title: meeting.title,
        description: meeting.description,
        status: meeting.status,
        startsAt: meeting.startsAt.toISOString(),
        endsAt: meeting.endsAt.toISOString(),
        dayLabel: formatDate(meeting.startsAt, locale, "EEEE"),
        timeLabel: `${formatDate(meeting.startsAt, locale, "HH:mm")} - ${formatDate(meeting.endsAt, locale, "HH:mm")}`,
        fullDateLabel: formatDate(meeting.startsAt, locale, "EEEE, d MMM yyyy"),
        location: meeting.location,
        meetingLink: meeting.meetingLink,
        outcome: meeting.outcome,
        clientId: meeting.clientId,
        assignedToId: meeting.assignedToId,
        client: meeting.client,
        assignedTo: meeting.assignedTo,
        comments: meeting.comments.map((comment) => ({
          id: comment.id,
          body: comment.body,
          createdAt: comment.createdAt.toISOString(),
          createdAtLabel: formatDate(comment.createdAt, locale, "d MMM, HH:mm"),
          editedAt: comment.editedAt?.toISOString() ?? null,
          mentionUserIds: comment.mentionUserIds,
          author: comment.author,
        })),
      })),
  }));

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2.4rem] border border-[var(--ui-border)] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--ui-surface-solid)_92%,transparent),color-mix(in_srgb,var(--ui-surface-muted)_100%,transparent))] shadow-[var(--ui-shadow-soft)]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-10 top-10 h-32 w-32 rounded-full bg-[color-mix(in_srgb,var(--ui-brand)_10%,transparent)] blur-3xl" />
          <div className="absolute bottom-[-3rem] right-[-2rem] h-44 w-44 rounded-full bg-[color-mix(in_srgb,var(--ui-ring)_55%,transparent)] blur-3xl" />
        </div>

        <div className="relative grid gap-8 px-5 py-6 sm:px-6 sm:py-7 xl:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] xl:items-start">
          <div className="max-w-3xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--ui-text-soft)]">{t("Schedule")}</p>
            <h1 className="mt-3 text-[2.65rem] font-semibold tracking-tight text-[var(--ui-text-strong)] sm:text-[3.35rem]">
              {t("Meetings")}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--ui-text-muted)]">
              {t("Open the week view, jump into any meeting card, leave comments, tag teammates, and edit the schedule without leaving the board.")}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] px-4 py-2 text-sm font-medium text-[var(--ui-text)] shadow-[var(--ui-shadow-xs)]">
                <CalendarDays className="h-4 w-4 text-[var(--ui-text-soft)]" />
                <span>{t("Week {week}", { week: format(selectedWeekStart, "I") })}</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[color-mix(in_srgb,var(--ui-surface-muted)_92%,transparent)] px-4 py-2 text-sm text-[var(--ui-text-muted)]">
                <span className="inline-block h-2 w-2 rounded-full bg-[var(--ui-brand)]" />
                <span>{formatDate(selectedWeekStart, locale, "d MMM")} - {formatDate(selectedWeekEnd, locale, "d MMM")}</span>
              </div>
            </div>
          </div>

          <div className="w-full rounded-[1.9rem] border border-[var(--ui-border)] bg-[color-mix(in_srgb,var(--ui-surface-solid)_86%,transparent)] p-4 shadow-[var(--ui-shadow-xs)] backdrop-blur xl:max-w-[24rem] xl:justify-self-end xl:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--ui-text-soft)]">{t("Week in focus")}</p>
                <p className="mt-2 text-xl font-semibold tracking-tight text-[var(--ui-text-strong)]">
                  {t("Week {week}", { week: format(selectedWeekStart, "I") })}
                </p>
              </div>
              <div className="hidden rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] px-3 py-1 text-xs font-medium text-[var(--ui-text-muted)] sm:inline-flex">
                {t("{count} meetings", { count: meetings.length })}
              </div>
            </div>

            <div className="mt-5 grid gap-2">
              <WeekButton href={createMeetingsWeekHref(prevWeek)} label={t("Previous week")} icon={<ArrowLeft className="h-4 w-4 shrink-0" />} />
              <WeekButton href={createMeetingsWeekHref(nextWeek)} label={t("Next week")} icon={<ArrowRight className="h-4 w-4 shrink-0" />} />
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <WeekButton
                href={createMeetingsWeekHref(currentWeek)}
                label={t("Current week")}
                active={selectedWeekKey === currentWeek}
                className="justify-center text-center"
              />
              <div className="[&_button]:h-auto [&_button]:min-h-14 [&_button]:w-full [&_button]:justify-center [&_button]:whitespace-normal [&_button]:rounded-2xl [&_button]:px-4 [&_button]:py-3 [&_button]:text-center [&_button]:leading-5">
                <MeetingDialog users={users} clients={clients} defaults={{ assignedToId: user.id }} triggerLabel="Schedule meeting" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <MeetingScheduleBoard
        days={days}
        currentUserId={user.id}
        users={users}
        clients={clients}
        t={t}
      />
    </div>
  );
}
