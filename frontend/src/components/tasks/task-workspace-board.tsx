import { CheckCheck, CircleDashed, LoaderCircle } from "lucide-react";
import { TaskDetailDialog } from "@/components/records/task-detail-dialog";
import type { MentionableUser } from "@/components/records/record-detail-types";
import type { TaskBoardRecord } from "@/components/tasks/task-list-board";
import { cn } from "@/lib/utils";

const statusOrder = ["TODO", "IN_PROGRESS", "DONE"] as const;

const statusMeta = {
  TODO: {
    icon: CircleDashed,
    tone: "border-white/10 bg-white/5 text-white/72",
    section: "border-white/6 bg-[#131418]",
  },
  IN_PROGRESS: {
    icon: LoaderCircle,
    tone: "border-sky-500/30 bg-sky-500/18 text-sky-200",
    section: "border-sky-500/14 bg-[#101722]",
  },
  DONE: {
    icon: CheckCheck,
    tone: "border-emerald-500/30 bg-emerald-500/18 text-emerald-200",
    section: "border-emerald-500/14 bg-[#101b17]",
  },
} as const;

export function TaskWorkspaceBoard({
  tasks,
  currentUserId,
  users,
  clients,
  leads,
  deals,
  t,
}: {
  tasks: TaskBoardRecord[];
  currentUserId: string;
  users: MentionableUser[];
  clients: Array<{ id: string; company: string }>;
  leads: Array<{ id: string; company: string }>;
  deals: Array<{ id: string; title: string }>;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <div className="space-y-4">
      {statusOrder.map((status) => {
        const groupTasks = tasks.filter((task) => task.status === status);
        const meta = statusMeta[status];
        const Icon = meta.icon;

        return (
          <section
            key={status}
            className={cn(
              "overflow-hidden rounded-[1.8rem] border shadow-[0_18px_42px_rgba(0,0,0,0.24)]",
              meta.section,
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/6 px-4 py-4 sm:px-5">
              <div className="flex items-center gap-3">
                <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em]", meta.tone)}>
                  <Icon className="h-3.5 w-3.5" />
                  {t(status)}
                </span>
                <span className="text-sm font-medium text-white/42">{groupTasks.length}</span>
              </div>
              <div className="text-xs uppercase tracking-[0.18em] text-white/28">{t("Status")}</div>
            </div>

            {groupTasks.length ? (
              <div className="grid gap-3 p-4 sm:p-5 xl:grid-cols-2 2xl:grid-cols-3">
                {groupTasks.map((task) => (
                  <TaskDetailDialog
                    key={task.id}
                    task={task}
                    currentUserId={currentUserId}
                    users={users}
                    clients={clients}
                    leads={leads}
                    deals={deals}
                    layout="workspace"
                  />
                ))}
              </div>
            ) : (
              <div className="px-5 py-6 text-sm text-white/36">
                {t("No tasks yet")}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
