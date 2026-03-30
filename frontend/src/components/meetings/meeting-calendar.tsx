import { eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, isToday, startOfMonth, startOfWeek } from "date-fns";
import { enUS, uk as ukLocale } from "date-fns/locale";
import { cn } from "@/lib/utils";
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

const localeMap = {
  en: enUS,
  uk: ukLocale,
} as const;

const statusToneMap: Record<string, string> = {
  SCHEDULED: "border-sky-200 bg-sky-50 text-sky-700",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCELED: "border-rose-200 bg-rose-50 text-rose-700",
  NO_SHOW: "border-amber-200 bg-amber-50 text-amber-700",
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
    format(days[index]!, "EEE", { locale: localeMap[locale] }),
  );

  return (
    <section className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">{t("Calendar overview")}</h3>
          <p className="mt-1 text-sm text-slate-500">{t("A compact month view for spotting busy days and open space.")}</p>
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
          {t("{count} meetings", { count: meetings.length })}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-2 text-center text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
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
                isSameMonth(day, month) ? "border-slate-200 bg-[var(--ui-surface-solid)]" : "border-slate-200 bg-slate-50/75 opacity-70",
                isToday(day) ? "border-[var(--ui-border-strong)] shadow-[var(--ui-shadow-xs)]" : "",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "text-sm font-semibold",
                    isSameMonth(day, month) ? "text-slate-900" : "text-slate-400",
                    isToday(day) ? "rounded-full bg-[var(--ui-brand)] px-2 py-1 text-[var(--ui-brand-foreground)]" : "",
                  )}
                >
                  {format(day, "d")}
                </span>
                {dayMeetings.length ? <span className="text-[11px] text-slate-400">{dayMeetings.length}</span> : null}
              </div>

              <div className="mt-3 space-y-2">
                {dayMeetings.slice(0, 2).map((meeting) => (
                  <div
                    key={meeting.id}
                    className={cn(
                      "rounded-xl border px-2.5 py-2",
                      statusToneMap[meeting.status] ?? "border-slate-200 bg-slate-50 text-slate-700",
                    )}
                  >
                    <p className="truncate text-[11px] font-semibold">{format(meeting.startsAt, "HH:mm")} • {meeting.title}</p>
                    <p className="mt-1 truncate text-[11px] opacity-80">{meeting.client.company}</p>
                  </div>
                ))}

                {dayMeetings.length > 2 ? (
                  <p className="text-[11px] text-slate-400">
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
