import { CheckCheck, CircleDashed, LoaderCircle } from "lucide-react";
import { TaskDetailDialog } from "@/components/records/task-detail-dialog";
import type { MentionableUser } from "@/components/records/record-detail-types";
import type { TaskBoardRecord } from "@/components/tasks/task-list-board";
import { cn } from "@/lib/utils";

const statusOrder = ["TODO", "IN_PROGRESS", "DONE"] as const;

const statusMeta = {
  TODO: {
    icon: CircleDashed,
    tone: "border-slate-200/60 bg-slate-100 text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400",
    section: "bg-slate-50/50 dark:bg-[#101114]",
  },
  IN_PROGRESS: {
    icon: LoaderCircle,
    tone: "border-sky-200 bg-sky-50 text-sky-600 dark:border-sky-900/50 dark:bg-sky-900/20 dark:text-sky-400",
    section: "bg-slate-50/50 dark:bg-[#101114]",
  },
  DONE: {
    icon: CheckCheck,
    tone: "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-400",
    section: "bg-slate-50/50 dark:bg-[#101114]",
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
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 xl:gap-6 items-start">
      {statusOrder.map((status) => {
        const groupTasks = tasks.filter((task) => task.status === status);
        const meta = statusMeta[status];
        const Icon = meta.icon;

        return (
          <section
            key={status}
            className={cn(
              "flex max-h-[calc(100vh-14rem)] flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 shadow-sm dark:border-slate-800",
              meta.section,
            )}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800/80">
              <div className="flex items-center gap-3">
                <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold", meta.tone)}>
                  <Icon className="h-3.5 w-3.5" />
                  {t(status)}
                </span>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-500 shadow-sm dark:bg-slate-800 dark:text-slate-400">
                  {groupTasks.length}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
              {groupTasks.length > 0 ? (
                <div className="flex flex-col gap-3">
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
                <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/50 text-sm font-medium text-slate-400 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-500">
                  {t("No tasks yet")}
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
