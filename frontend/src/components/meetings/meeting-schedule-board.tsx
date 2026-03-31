import { CalendarRange } from "lucide-react";
import { MeetingDetailDialog } from "@/components/records/meeting-detail-dialog";
import type { MentionableUser, RecordCommentItem } from "@/components/records/record-detail-types";
import { EmptyState } from "@/components/ui/empty-state";

type MeetingScheduleRecord = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  startsAt: string;
  endsAt: string;
  dayLabel: string;
  timeLabel: string;
  fullDateLabel: string;
  location?: string | null;
  meetingLink?: string | null;
  outcome?: string | null;
  clientId: string;
  assignedToId: string;
  comments: RecordCommentItem[];
  client: {
    id: string;
    company: string;
  };
  assignedTo: {
    id: string;
    name: string;
    email?: string | null;
    nickname?: string | null;
    avatarColor?: string | null;
    companyLogoUrl?: string | null;
  };
};

type MeetingScheduleDay = {
  key: string;
  label: string;
  shortDateLabel: string;
  isToday: boolean;
  meetings: MeetingScheduleRecord[];
};

export function MeetingScheduleBoard({
  days,
  currentUserId,
  users,
  clients,
  t,
}: {
  days: MeetingScheduleDay[];
  currentUserId: string;
  users: MentionableUser[];
  clients: Array<{ id: string; company: string }>;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const totalMeetings = days.reduce((sum, day) => sum + day.meetings.length, 0);

  if (!totalMeetings) {
    return (
      <EmptyState
        title={t("No upcoming meetings in this week")}
        description={t("Your schedule is clear for this week. Add a new meeting or move to another week.")}
      />
    );
  }

  return (
    <section className="rounded-[2rem] border border-[var(--ui-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--ui-surface-solid)_96%,transparent),color-mix(in_srgb,var(--ui-surface-muted)_100%,transparent))] p-4 shadow-[var(--ui-shadow-soft)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--ui-text-soft)]">{t("Schedule")}</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-[var(--ui-text-strong)]">{t("Meeting flow")}</h2>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] px-3 py-1 text-xs font-medium text-[var(--ui-text-muted)] shadow-[var(--ui-shadow-xs)]">
          <CalendarRange className="h-3.5 w-3.5" />
          {t("{count} meetings", { count: totalMeetings })}
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-7">
        {days.map((day) => (
          <section
            key={day.key}
            className={[
              "rounded-[1.6rem] border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] p-3 shadow-[var(--ui-shadow-xs)]",
              day.isToday ? "border-[var(--ui-border-strong)] shadow-[var(--ui-shadow-soft)]" : "",
            ].join(" ")}
          >
            <div className="rounded-[1.25rem] border border-[var(--ui-border)] bg-[color-mix(in_srgb,var(--ui-surface-muted)_92%,transparent)] px-3 py-3 text-center">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--ui-text-soft)]">{day.label}</p>
              <p className="mt-1 text-lg font-semibold text-[var(--ui-text-strong)]">{day.shortDateLabel}</p>
            </div>

            <div className="mt-3 space-y-3">
              {day.meetings.length ? (
                day.meetings.map((meeting) => (
                  <MeetingDetailDialog
                    key={meeting.id}
                    meeting={meeting}
                    currentUserId={currentUserId}
                    users={users}
                    clients={clients}
                  />
                ))
              ) : (
                <div className="rounded-[1.35rem] border border-dashed border-[var(--ui-border)] bg-[color-mix(in_srgb,var(--ui-surface-muted)_92%,transparent)] px-3 py-5 text-center text-sm text-[var(--ui-text-soft)]">
                  {t("No meetings")}
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
