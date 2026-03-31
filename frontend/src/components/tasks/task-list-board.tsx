import { TaskDetailDialog } from "@/components/records/task-detail-dialog";
import type { MentionableUser, RecordCommentItem } from "@/components/records/record-detail-types";
import { EmptyState } from "@/components/ui/empty-state";

export type TaskBoardRecord = {
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

export function TaskListBoard({
  tasks,
  currentUserId,
  users,
  clients,
  leads,
  deals,
  emptyTitle,
  emptyDescription,
  layout = "default",
}: {
  tasks: TaskBoardRecord[];
  currentUserId: string;
  users: MentionableUser[];
  clients: Array<{ id: string; company: string }>;
  leads: Array<{ id: string; company: string }>;
  deals: Array<{ id: string; title: string }>;
  emptyTitle: string;
  emptyDescription: string;
  layout?: "default" | "workspace";
}) {
  if (!tasks.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <TaskDetailDialog
          key={task.id}
          task={task}
          currentUserId={currentUserId}
          users={users}
          clients={clients}
          leads={leads}
          deals={deals}
          layout={layout}
        />
      ))}
    </div>
  );
}
