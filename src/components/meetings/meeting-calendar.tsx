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
    <div className="card rounded-[2rem] p-5">
      <div>
        <h3 className="text-lg font-semibold text-slate-950">{t("Meetings calendar")}</h3>
        <p className="mt-1 text-sm text-slate-500">{t("Review scheduled calls, demos, and account meetings across the month.")}</p>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        {weekDays.map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dayMeetings = meetings.filter(
            (meeting) => format(meeting.startsAt, "yyyy-MM-dd") === format(day, "yyyy-MM-dd"),
          );

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-36 rounded-[1.5rem] border p-3",
                isSameMonth(day, month) ? "border-white/80 bg-white/80" : "border-slate-100 bg-slate-50/80",
                isToday(day) ? "shadow-[0_0_0_1px_rgba(15,23,42,0.12)]" : "",
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "text-sm font-semibold",
                    isSameMonth(day, month) ? "text-slate-900" : "text-slate-400",
                    isToday(day) ? "rounded-full bg-slate-950 px-2 py-1 text-white" : "",
                  )}
                >
                  {format(day, "d")}
                </span>
                {dayMeetings.length ? <span className="text-[11px] text-slate-400">{dayMeetings.length}</span> : null}
              </div>
              <div className="mt-3 space-y-2">
                {dayMeetings.slice(0, 3).map((meeting) => (
                  <div key={meeting.id} className="rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-2">
                    <p className="truncate text-[11px] font-semibold text-slate-900">{meeting.title}</p>
                    <p className="mt-1 truncate text-[11px] text-slate-500">
                      {format(meeting.startsAt, "HH:mm")} • {meeting.client.company}
                    </p>
                  </div>
                ))}
                {dayMeetings.length > 3 ? (
                  <p className="text-[11px] text-slate-400">
                    {t("+{count} more", { count: dayMeetings.length - 3 })}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
