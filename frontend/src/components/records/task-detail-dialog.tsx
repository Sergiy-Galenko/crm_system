"use client";

import { startTransition, useState } from "react";
import Link from "next/link";
import { CalendarClock, CheckCircle2, Link2, MessageSquareText, RotateCcw, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteTaskAction, restoreTaskAction, updateTaskStatusAction } from "@/actions/tasks";
import { TaskDialog } from "@/components/forms/task-dialog";
import { useLocale } from "@/components/providers/locale-provider";
import { RecordCommentsPanel } from "@/components/records/record-comments-panel";
import type { MentionableUser, RecordCommentItem } from "@/components/records/record-detail-types";
import { StatusBadge } from "@/components/status-badge";
import { UserAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type TaskDetailRecord = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  dueDate: string;
  dueDateLabel: string;
  updatedAtLabel: string;
  assignedToId?: string | null;
  tags: string[];
  clientId?: string | null;
  leadId?: string | null;
  dealId?: string | null;
  comments: RecordCommentItem[];
  assignedTo?: {
    id: string;
    name: string;
    email?: string | null;
    nickname?: string | null;
    avatarColor?: string | null;
    companyLogoUrl?: string | null;
  } | null;
  client?: {
    id: string;
    company: string;
  } | null;
  lead?: {
    id: string;
    company: string;
  } | null;
  deal?: {
    id: string;
    title: string;
  } | null;
};

export function TaskDetailDialog({
  task,
  currentUserId,
  users,
  clients,
  leads,
  deals,
  layout = "default",
}: {
  task: TaskDetailRecord;
  currentUserId: string;
  users: MentionableUser[];
  clients: Array<{ id: string; company: string }>;
  leads: Array<{ id: string; company: string }>;
  deals: Array<{ id: string; title: string }>;
  layout?: "default" | "workspace";
}) {
  const router = useRouter();
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [taskState, setTaskState] = useState(task);
  const [commentCount, setCommentCount] = useState(task.comments.length);
  const [isDeleting, setIsDeleting] = useState(false);

  function handleStatusChange(nextStatus: "TODO" | "IN_PROGRESS" | "DONE") {
    startTransition(async () => {
      if (nextStatus === "IN_PROGRESS" && taskState.status === "DONE") {
        await restoreTaskAction(taskState.id);
      } else {
        await updateTaskStatusAction(taskState.id, nextStatus);
      }

      setTaskState((current) => ({
        ...current,
        status: nextStatus,
      }));
    });
  }

  function handleDelete() {
    setIsDeleting(true);

    startTransition(async () => {
      await deleteTaskAction(taskState.id);
      setOpen(false);
      router.refresh();
    });
  }

  const workspaceStatusClassName = {
    TODO: "border-white/10 bg-white/5 text-white/72",
    IN_PROGRESS: "border-sky-500/30 bg-sky-500/18 text-sky-200",
    DONE: "border-emerald-500/30 bg-emerald-500/18 text-emerald-200",
  }[taskState.status] ?? "border-white/10 bg-white/5 text-white/72";

  const workspacePriorityClassName = {
    LOW: "border-violet-500/25 bg-violet-500/15 text-violet-200",
    MEDIUM: "border-amber-500/30 bg-amber-500/18 text-amber-200",
    HIGH: "border-rose-500/30 bg-rose-500/18 text-rose-200",
  }[taskState.priority] ?? "border-white/10 bg-white/5 text-white/72";

  const workspaceLinkedLabel = taskState.client?.company ?? taskState.deal?.title ?? taskState.lead?.company ?? null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "group w-full text-left transition",
            layout === "workspace"
              ? "rounded-[1.45rem] border border-white/8 bg-[#18191d] p-4 shadow-[0_12px_34px_rgba(0,0,0,0.18)] hover:border-white/14 hover:bg-[#1d1f24] hover:shadow-[0_18px_42px_rgba(0,0,0,0.28)]"
              : "rounded-[2rem] border border-[var(--ui-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--ui-surface-solid)_94%,transparent),color-mix(in_srgb,var(--ui-surface-muted)_100%,transparent))] p-5 shadow-[var(--ui-shadow-xs)] hover:border-[var(--ui-border-strong)] hover:shadow-[var(--ui-shadow-soft)]",
          )}
        >
          {layout === "workspace" ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]", workspaceStatusClassName)}>
                      {t(taskState.status)}
                    </span>
                    <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]", workspacePriorityClassName)}>
                      {t(taskState.priority)}
                    </span>
                  </div>
                  <h3 className="mt-3 text-[15px] font-semibold leading-6 text-white/95 transition group-hover:text-white">
                    {taskState.title}
                  </h3>
                  {taskState.description ? (
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/48">
                      {taskState.description}
                    </p>
                  ) : null}
                </div>
                <div className="hidden text-[10px] uppercase tracking-[0.18em] text-white/28 sm:block">
                  {taskState.updatedAtLabel}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/68">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {taskState.dueDateLabel}
                  </span>
                  {workspaceLinkedLabel ? (
                    <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-[#111216] px-3 py-1.5 text-xs font-medium text-white/56">
                      <Link2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{workspaceLinkedLabel}</span>
                    </span>
                  ) : null}
                </div>

                <div className="flex min-w-0 items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/68">
                    <MessageSquareText className="h-3.5 w-3.5" />
                    {commentCount}
                  </span>
                  {taskState.assignedTo ? (
                    <div className="inline-flex min-w-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1.5">
                      <UserAvatar
                        name={taskState.assignedTo.name}
                        color={taskState.assignedTo.avatarColor}
                        imageUrl={taskState.assignedTo.companyLogoUrl}
                        className="h-7 w-7 rounded-full"
                      />
                      <span className="max-w-28 truncate text-xs font-medium text-white/76">
                        {taskState.assignedTo.nickname ? `@${taskState.assignedTo.nickname}` : taskState.assignedTo.name}
                      </span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded-full border border-dashed border-white/12 px-3 py-1.5 text-xs font-medium text-white/46">
                      <UserRound className="h-3.5 w-3.5" />
                      {t("Unassigned")}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-[var(--ui-text-strong)]">{taskState.title}</h3>
                  <StatusBadge value={taskState.status} />
                  <StatusBadge value={taskState.priority} />
                  <span className="inline-flex items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] px-3 py-1 text-xs font-medium text-[var(--ui-text-muted)] shadow-[var(--ui-shadow-xs)]">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {t("Due")} {taskState.dueDateLabel}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] px-3 py-1 text-xs font-medium text-[var(--ui-text-muted)] shadow-[var(--ui-shadow-xs)]">
                    <MessageSquareText className="h-3.5 w-3.5" />
                    {commentCount}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  {taskState.assignedTo ? (
                    <div className="inline-flex min-w-0 items-center gap-3 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] px-3 py-2 shadow-[var(--ui-shadow-xs)]">
                      <UserAvatar
                        name={taskState.assignedTo.name}
                        color={taskState.assignedTo.avatarColor}
                        imageUrl={taskState.assignedTo.companyLogoUrl}
                        className="h-9 w-9 rounded-full"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--ui-text-strong)]">{taskState.assignedTo.name}</p>
                        <p className="truncate text-xs text-[var(--ui-text-muted)]">
                          {taskState.assignedTo.nickname ? `@${taskState.assignedTo.nickname}` : taskState.assignedTo.email}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="inline-flex min-w-0 items-center gap-2 rounded-full border border-dashed border-[var(--ui-border)] bg-[color-mix(in_srgb,var(--ui-surface-muted)_92%,transparent)] px-3 py-2 text-sm font-medium text-[var(--ui-text-muted)]">
                      <UserRound className="h-4 w-4" />
                      {t("Unassigned")}
                    </div>
                  )}
                  {taskState.client ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] px-3 py-2 text-sm text-[var(--ui-text-muted)] shadow-[var(--ui-shadow-xs)]">
                      {t("Client")}: {taskState.client.company}
                    </span>
                  ) : null}
                </div>

                {taskState.description ? (
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--ui-text-muted)]">{taskState.description}</p>
                ) : null}
              </div>

              <div className="text-xs uppercase tracking-[0.14em] text-[var(--ui-text-soft)]">{taskState.updatedAtLabel}</div>
            </div>
          )}
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-[min(1120px,calc(100vw-2rem))] gap-0 overflow-hidden p-0">
        <div className="grid min-h-[min(78vh,760px)] gap-0 xl:grid-cols-[minmax(0,1.08fr)_24rem]">
          <div className="min-w-0 border-b border-[var(--ui-border)] p-6 xl:border-b-0 xl:border-r xl:p-7">
            <DialogHeader>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <DialogTitle className="text-[2rem] leading-tight">{taskState.title}</DialogTitle>
                  <DialogDescription className="mt-3 max-w-2xl text-sm leading-7">
                    {taskState.description || t("Keep execution context, assignee decisions, and follow-up details in one focused task view.")}
                  </DialogDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <TaskDialog
                    users={users}
                    clients={clients}
                    leads={leads}
                    deals={deals}
                    showLinkedRecords
                    task={{
                      id: taskState.id,
                      title: taskState.title,
                      description: taskState.description,
                      status: taskState.status,
                      priority: taskState.priority,
                      dueDate: new Date(taskState.dueDate),
                      assignedToId: taskState.assignedToId ?? undefined,
                      tags: taskState.tags,
                      clientId: taskState.clientId,
                      leadId: taskState.leadId,
                      dealId: taskState.dealId,
                    }}
                    triggerLabel="Edit task"
                    onSuccess={() => router.refresh()}
                  />
                  <Button type="button" variant="ghost" className="rounded-xl text-rose-500 hover:bg-rose-500/10 hover:text-rose-400" disabled={isDeleting} onClick={handleDelete}>
                    {t("Delete")}
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] p-4 shadow-[var(--ui-shadow-xs)]">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--ui-text-soft)]">{t("Execution state")}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusBadge value={taskState.status} />
                  <StatusBadge value={taskState.priority} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {taskState.status === "TODO" ? (
                    <Button type="button" variant="secondary" className="rounded-xl" onClick={() => handleStatusChange("IN_PROGRESS")}>
                      {t("Start work")}
                    </Button>
                  ) : null}
                  {taskState.status !== "DONE" ? (
                    <Button type="button" variant="secondary" className="rounded-xl" onClick={() => handleStatusChange("DONE")}>
                      <CheckCircle2 className="h-4 w-4" />
                      {t("Complete")}
                    </Button>
                  ) : (
                    <Button type="button" variant="subtle" className="rounded-xl" onClick={() => handleStatusChange("IN_PROGRESS")}>
                      <RotateCcw className="h-4 w-4" />
                      {t("Return to active")}
                    </Button>
                  )}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] p-4 shadow-[var(--ui-shadow-xs)]">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--ui-text-soft)]">{t("Due date")}</p>
                <p className="mt-3 text-base font-semibold text-[var(--ui-text-strong)]">{taskState.dueDateLabel}</p>
                <p className="mt-1 text-sm text-[var(--ui-text-muted)]">{taskState.updatedAtLabel}</p>
              </div>

              <div className="rounded-[1.5rem] border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] p-4 shadow-[var(--ui-shadow-xs)]">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--ui-text-soft)]">{t("Assignee")}</p>
                {taskState.assignedTo ? (
                  <div className="mt-3 flex items-center gap-3">
                    <UserAvatar
                      name={taskState.assignedTo.name}
                      color={taskState.assignedTo.avatarColor}
                      imageUrl={taskState.assignedTo.companyLogoUrl}
                      className="h-11 w-11 rounded-full"
                    />
                    <div>
                      <p className="text-sm font-semibold text-[var(--ui-text-strong)]">{taskState.assignedTo.name}</p>
                      <p className="text-sm text-[var(--ui-text-muted)]">
                        {taskState.assignedTo.nickname ? `@${taskState.assignedTo.nickname}` : taskState.assignedTo.email}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-[var(--ui-text-muted)]">{t("Unassigned")}</p>
                )}
              </div>

              <div className="rounded-[1.5rem] border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] p-4 shadow-[var(--ui-shadow-xs)]">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--ui-text-soft)]">{t("Linked records")}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {taskState.client ? (
                    <Link href={`/dashboard/clients/${taskState.client.id}`} className="inline-flex items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text-muted)] transition hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-text-strong)]">
                      <Link2 className="h-3.5 w-3.5" />
                      {t("Client")}: {taskState.client.company}
                    </Link>
                  ) : null}
                  {taskState.lead ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text-muted)]">
                      {t("Lead")}: {taskState.lead.company}
                    </span>
                  ) : null}
                  {taskState.deal ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-2 text-sm text-[var(--ui-text-muted)]">
                      {t("Deal")}: {taskState.deal.title}
                    </span>
                  ) : null}
                  {!taskState.client && !taskState.lead && !taskState.deal ? (
                    <p className="text-sm text-[var(--ui-text-muted)]">{t("No linked records yet")}</p>
                  ) : null}
                </div>
              </div>
            </div>

            {taskState.tags.length ? (
              <div className="mt-4 rounded-[1.5rem] border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] p-4 shadow-[var(--ui-shadow-xs)]">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--ui-text-soft)]">{t("Tags")}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {taskState.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-soft)] px-3 py-1 text-xs font-medium text-[var(--ui-text-muted)]">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="min-w-0 p-4 xl:p-5">
            <RecordCommentsPanel
              taskId={taskState.id}
              currentUserId={currentUserId}
              comments={taskState.comments}
              mentionableUsers={users}
              onCommentsCountChange={setCommentCount}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
