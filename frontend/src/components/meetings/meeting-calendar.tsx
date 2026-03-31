import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, isToday, startOfMonth, startOfWeek } from "date-fns";
import { cn, getDateLocale } from "@/lib/utils";
import type { Locale } from "@/lib/locale";

type MeetingCalendarItem = {
  id: string;
  title: string;
  status: string;
  startsAt: Date;
  client: {
    company: string;
  };
};

const statusToneMap: Record<string, string> = {
  SCHEDULED: "border-[var(--ui-badge-info-border)] bg-[var(--ui-badge-info-bg)] text-[var(--ui-badge-info-text)]",
  COMPLETED: "border-[var(--ui-badge-success-border)] bg-[var(--ui-badge-success-bg)] text-[var(--ui-badge-success-text)]",
  CANCELED: "border-[var(--ui-badge-danger-border)] bg-[var(--ui-badge-danger-bg)] text-[var(--ui-badge-danger-text)]",
  NO_SHOW: "border-[var(--ui-badge-warning-border)] bg-[var(--ui-badge-warning-bg)] text-[var(--ui-badge-warning-text)]",
};

export function MeetingCalendar({
  month,
  locale,
  meetings,
  t,
}: {
  month: Date;
  locale: Locale;
  meetings: MeetingCalendarItem[];
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = Array.from({ length: 7 }, (_, index) =>
    format(days[index]!, "EEE", { locale: getDateLocale(locale) }),
  );

  return (
    <section className="rounded-[2rem] border border-[var(--ui-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--ui-surface-solid)_94%,transparent),color-mix(in_srgb,var(--ui-surface-muted)_100%,transparent))] p-5 shadow-[var(--ui-shadow-soft)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-[var(--ui-text-strong)]">{t("Calendar overview")}</h3>
          <p className="mt-1 text-sm text-[var(--ui-text-muted)]">{t("A compact month view for spotting busy days and open space.")}</p>
        </div>
        <div className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] px-3 py-1 text-xs font-medium text-[var(--ui-text-muted)] shadow-[var(--ui-shadow-xs)]">
          {t("{count} meetings", { count: meetings.length })}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-2 text-center text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--ui-text-soft)]">
        {weekDays.map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dayKey = format(day, "yyyy-MM-dd");
          const dayMeetings = meetings.filter(
            (meeting) => format(meeting.startsAt, "yyyy-MM-dd") === dayKey,
          );

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-28 rounded-[1.35rem] border p-3",
                isSameMonth(day, month)
                  ? "border-[var(--ui-border)] bg-[var(--ui-surface-solid)] shadow-[var(--ui-shadow-xs)]"
                  : "border-[var(--ui-border)] bg-[color-mix(in_srgb,var(--ui-surface-muted)_88%,transparent)] opacity-72",
                isToday(day) ? "border-[var(--ui-border-strong)] shadow-[var(--ui-shadow-soft)]" : "",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "text-sm font-semibold",
                    isSameMonth(day, month) ? "text-[var(--ui-text-strong)]" : "text-[var(--ui-text-soft)]",
                    isToday(day) ? "rounded-full bg-[var(--ui-brand)] px-2 py-1 text-[var(--ui-brand-foreground)]" : "",
                  )}
                >
                  {format(day, "d")}
                </span>
                {dayMeetings.length ? <span className="text-[11px] text-[var(--ui-text-soft)]">{dayMeetings.length}</span> : null}
              </div>

              <div className="mt-3 space-y-2">
                {dayMeetings.slice(0, 2).map((meeting) => (
                  <div
                    key={meeting.id}
                    className={cn(
                      "rounded-xl border px-2.5 py-2",
                      statusToneMap[meeting.status] ?? "border-[var(--ui-border)] bg-[var(--ui-surface-muted)] text-[var(--ui-text)]",
                    )}
                  >
                    <p className="truncate text-[11px] font-semibold">{format(meeting.startsAt, "HH:mm")} • {meeting.title}</p>
                    <p className="mt-1 truncate text-[11px] opacity-80">{meeting.client.company}</p>
                  </div>
                ))}

                {dayMeetings.length > 2 ? (
                  <p className="text-[11px] text-[var(--ui-text-soft)]">
                    {t("+{count} more", { count: dayMeetings.length - 2 })}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
