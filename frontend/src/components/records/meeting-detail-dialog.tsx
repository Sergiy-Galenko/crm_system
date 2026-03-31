"use client";

import { startTransition, useState } from "react";
import Link from "next/link";
import { ExternalLink, MapPin, MessageSquareText, Trash2, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteMeetingAction, updateMeetingStatusAction } from "@/actions/meetings";
import { MeetingDialog } from "@/components/forms/meeting-dialog";
import { useLocale } from "@/components/providers/locale-provider";
import { RecordCommentsPanel } from "@/components/records/record-comments-panel";
import type { MentionableUser, RecordCommentItem } from "@/components/records/record-detail-types";
import { StatusBadge } from "@/components/status-badge";
import { UserAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type MeetingDetailRecord = {
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

export function MeetingDetailDialog({
  meeting,
  currentUserId,
  users,
  clients,
}: {
  meeting: MeetingDetailRecord;
  currentUserId: string;
  users: MentionableUser[];
  clients: Array<{ id: string; company: string }>;
}) {
  const router = useRouter();
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [meetingState, setMeetingState] = useState(meeting);
  const [commentCount, setCommentCount] = useState(meeting.comments.length);

  function handleStatusChange(nextStatus: "SCHEDULED" | "COMPLETED" | "CANCELED" | "NO_SHOW") {
    startTransition(async () => {
      await updateMeetingStatusAction(meetingState.id, nextStatus);
      setMeetingState((current) => ({
        ...current,
        status: nextStatus,
      }));
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteMeetingAction(meetingState.id);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="w-full rounded-[1.5rem] border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] p-3.5 text-left shadow-[var(--ui-shadow-xs)] transition hover:border-[var(--ui-border-strong)] hover:shadow-[var(--ui-shadow-soft)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-[var(--ui-text-strong)]">{meetingState.timeLabel}</p>
                <StatusBadge value={meetingState.status} />
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-soft)] px-2 py-1 text-[11px] font-medium text-[var(--ui-text-muted)]">
                  <MessageSquareText className="h-3 w-3" />
                  {commentCount}
                </span>
              </div>
              <h3 className="mt-2 text-base font-semibold leading-6 text-[var(--ui-text-strong)]">{meetingState.title}</h3>
              <p className="mt-1 text-sm text-[var(--ui-text-muted)]">{meetingState.client.company}</p>
            </div>
          </div>
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-[min(1120px,calc(100vw-2rem))] gap-0 overflow-hidden p-0">
        <div className="grid min-h-[min(78vh,760px)] gap-0 xl:grid-cols-[minmax(0,1.08fr)_24rem]">
          <div className="min-w-0 border-b border-[var(--ui-border)] p-6 xl:border-b-0 xl:border-r xl:p-7">
            <DialogHeader>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <DialogTitle className="text-[2rem] leading-tight">{meetingState.title}</DialogTitle>
                  <DialogDescription className="mt-3 max-w-2xl text-sm leading-7">
                    {meetingState.description || t("Keep the meeting context, key decisions, and follow-up notes together in one focused view.")}
                  </DialogDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <MeetingDialog
                    users={users}
                    clients={clients}
                    meeting={{
                      id: meetingState.id,
                      title: meetingState.title,
                      description: meetingState.description,
                      status: meetingState.status,
                      startsAt: new Date(meetingState.startsAt),
                      endsAt: new Date(meetingState.endsAt),
                      location: meetingState.location,
                      meetingLink: meetingState.meetingLink,
                      outcome: meetingState.outcome,
                      clientId: meetingState.clientId,
                      assignedToId: meetingState.assignedToId,
                    }}
                    triggerLabel="Edit meeting"
                    onSuccess={() => router.refresh()}
                  />
                  <Button type="button" variant="ghost" className="rounded-xl text-rose-500 hover:bg-rose-500/10 hover:text-rose-400" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4" />
                    {t("Delete")}
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] p-4 shadow-[var(--ui-shadow-xs)]">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--ui-text-soft)]">{t("Time")}</p>
                <div className="mt-3">
                  <p className="text-base font-semibold text-[var(--ui-text-strong)]">{meetingState.fullDateLabel}</p>
                  <p className="mt-1 text-sm text-[var(--ui-text-muted)]">{meetingState.timeLabel}</p>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] p-4 shadow-[var(--ui-shadow-xs)]">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--ui-text-soft)]">{t("Assignee")}</p>
                <div className="mt-3 flex items-center gap-3">
                  <UserAvatar
                    name={meetingState.assignedTo.name}
                    color={meetingState.assignedTo.avatarColor}
                    imageUrl={meetingState.assignedTo.companyLogoUrl}
                    className="h-11 w-11 rounded-full"
                  />
                  <div>
                    <p className="text-sm font-semibold text-[var(--ui-text-strong)]">{meetingState.assignedTo.name}</p>
                    <p className="text-sm text-[var(--ui-text-muted)]">
                      {meetingState.assignedTo.nickname ? `@${meetingState.assignedTo.nickname}` : meetingState.assignedTo.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] p-4 shadow-[var(--ui-shadow-xs)]">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--ui-text-soft)]">{t("Client")}</p>
                <div className="mt-3">
                  <Link href={`/dashboard/clients/${meetingState.client.id}`} className="text-base font-semibold text-[var(--ui-text-strong)] transition hover:text-[var(--ui-text)]">
                    {meetingState.client.company}
                  </Link>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] p-4 shadow-[var(--ui-shadow-xs)]">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--ui-text-soft)]">{t("Location")}</p>
                <div className="mt-3 flex items-start gap-2 text-sm text-[var(--ui-text-muted)]">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{meetingState.location || t("No location")}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
              <div className="rounded-[1.5rem] border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] p-4 shadow-[var(--ui-shadow-xs)]">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--ui-text-soft)]">{t("Meeting actions")}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" className="rounded-xl" onClick={() => handleStatusChange("SCHEDULED")}>
                    {t("Move back to scheduled")}
                  </Button>
                  <Button type="button" variant="secondary" className="rounded-xl" onClick={() => handleStatusChange("COMPLETED")}>
                    {t("Complete")}
                  </Button>
                  <Button type="button" variant="subtle" className="rounded-xl" onClick={() => handleStatusChange("NO_SHOW")}>
                    {t("NO_SHOW")}
                  </Button>
                  <Button type="button" variant="ghost" className="rounded-xl" onClick={() => handleStatusChange("CANCELED")}>
                    {t("CANCELED")}
                  </Button>
                </div>
              </div>

              {meetingState.meetingLink ? (
                <Button asChild className="h-auto rounded-[1.5rem] px-5 py-4">
                  <a href={meetingState.meetingLink} target="_blank" rel="noreferrer">
                    <Video className="h-4 w-4" />
                    {t("Join meeting")}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              ) : null}
            </div>

            {meetingState.outcome ? (
              <div className="mt-4 rounded-[1.5rem] border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] p-4 shadow-[var(--ui-shadow-xs)]">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--ui-text-soft)]">{t("Outcome")}</p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--ui-text-muted)]">{meetingState.outcome}</p>
              </div>
            ) : null}
          </div>

          <div className="min-w-0 p-4 xl:p-5">
            <RecordCommentsPanel
              meetingId={meetingState.id}
              currentUserId={currentUserId}
              comments={meetingState.comments}
              mentionableUsers={users}
              onCommentsCountChange={setCommentCount}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
