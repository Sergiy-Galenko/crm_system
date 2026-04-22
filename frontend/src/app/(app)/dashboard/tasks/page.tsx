import { Prisma, type TaskPriority, type TaskStatus } from "@prisma/client";
import type { UrlObject } from "url";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  CalendarDays,
  LayoutGrid,
  Rows3,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { TaskDialog } from "@/components/forms/task-dialog";
import { TaskListBoard } from "@/components/tasks/task-list-board";
import { TaskWorkspaceBoard } from "@/components/tasks/task-workspace-board";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { clientAccessWhere, dealAccessWhere, leadAccessWhere, taskAccessWhere, visibleUsersWhere } from "@/lib/crm-scope";
import { prisma } from "@/lib/db";
import { taskPriorities, taskStatuses } from "@/lib/constants";
import { getServerTranslator } from "@/lib/locale-server";
import { createPageHref, getPage, getParam, type SearchParamsRecord } from "@/lib/query-params";
import { requireUser } from "@/lib/session";
import { cn, formatDate, toDateInputValue } from "@/lib/utils";

const pageSize = 10;

const taskListArgs = Prisma.validator<Prisma.TaskDefaultArgs>()({
  include: {
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
    client: {
      select: {
        id: true,
        company: true,
      },
    },
    lead: {
      select: {
        id: true,
        company: true,
      },
    },
    deal: {
      select: {
        id: true,
        title: true,
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
});

type TaskListItem = Prisma.TaskGetPayload<typeof taskListArgs>;

type TasksPageProps = {
  searchParams: Promise<SearchParamsRecord>;
};

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const user = await requireUser();
  const { locale, t } = await getServerTranslator();
  const resolvedSearchParams = await searchParams;
  const query = getParam(resolvedSearchParams, "q");
  const rawStatus = getParam(resolvedSearchParams, "status");
  const rawPriority = getParam(resolvedSearchParams, "priority");
  const rawAssignedTo = getParam(resolvedSearchParams, "assignedTo");
  const rawSort = getParam(resolvedSearchParams, "sort");
  const rawView = getParam(resolvedSearchParams, "view");
  const view = rawView === "list" ? "list" : "board";
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 1);
  const status = taskStatuses.includes(rawStatus as (typeof taskStatuses)[number]) ? rawStatus : "";
  const priority = taskPriorities.includes(rawPriority as (typeof taskPriorities)[number]) ? rawPriority : "";
  const sort = rawSort === "created-date" || rawSort === "priority" ? rawSort : "due-date";
  const page = getPage(resolvedSearchParams);

  const users = await prisma.user.findMany({
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
  });

  const assignee =
    rawAssignedTo === "unassigned" || users.some((teamUser) => teamUser.id === rawAssignedTo)
      ? rawAssignedTo
      : "";

  const baseWhere: Prisma.TaskWhereInput = taskAccessWhere(user);
  const where: Prisma.TaskWhereInput = { ...baseWhere };

  if (assignee === "unassigned") {
    where.assignedTo = null;
  } else if (assignee) {
    where.assignedToId = assignee;
  }

  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ];
  }

  if (status) {
    where.status = status as TaskStatus;
  }

  if (priority) {
    where.priority = priority as TaskPriority;
  }

  const orderBy: Prisma.TaskOrderByWithRelationInput[] =
    sort === "created-date"
      ? [{ createdAt: "desc" }]
      : sort === "priority"
        ? [{ priority: "desc" }, { dueDate: "asc" }]
        : [{ dueDate: "asc" }, { createdAt: "desc" }];

  const [tasks, totalTasks, clients, leads, deals, totalAccessibleTasks, statusBreakdown, assignedToMeCount] = await Promise.all([
    prisma.task.findMany({
      ...taskListArgs,
      where,
      orderBy,
      ...(view === "list"
        ? {
            skip: (page - 1) * pageSize,
            take: pageSize,
          }
        : {}),
    }),
    prisma.task.count({ where }),
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
    prisma.lead.findMany({
      where: leadAccessWhere(user),
      select: {
        id: true,
        company: true,
      },
      orderBy: {
        company: "asc",
      },
    }),
    prisma.deal.findMany({
      where: dealAccessWhere(user),
      select: {
        id: true,
        title: true,
      },
      orderBy: {
        title: "asc",
      },
    }),
    prisma.task.count({ where: baseWhere }),
    prisma.task.groupBy({
      by: ["status"],
      where: baseWhere,
      _count: {
        _all: true,
      },
    }),
    prisma.task.count({
      where: {
        ...baseWhere,
        assignedToId: user.id,
      },
    }),
  ]);

  const taskItems: TaskListItem[] = tasks;
  const taskCards = taskItems.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate.toISOString(),
    dueDateLabel: formatDate(task.dueDate, locale, "d MMM yyyy"),
    updatedAtLabel: t("Updated {time}", { time: formatDate(task.updatedAt, locale, "d MMM, HH:mm") }),
    assignedToId: task.assignedToId ?? null,
    tags: task.tags,
    clientId: task.clientId,
    leadId: task.leadId,
    dealId: task.dealId,
    assignedTo: task.assignedTo,
    client: task.client,
    lead: task.lead,
    deal: task.deal,
    comments: task.comments.map((comment) => ({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      createdAtLabel: formatDate(comment.createdAt, locale, "d MMM, HH:mm"),
      editedAt: comment.editedAt?.toISOString() ?? null,
      mentionUserIds: comment.mentionUserIds,
      author: comment.author,
    })),
  }));

  const pageCount = Math.max(1, Math.ceil(totalTasks / pageSize));
  const prevHref = createPageHref("/dashboard/tasks", resolvedSearchParams, { page: String(Math.max(1, page - 1)) });
  const nextHref = createPageHref("/dashboard/tasks", resolvedSearchParams, { page: String(Math.min(pageCount, page + 1)) });

  const statusCountMap = Object.fromEntries(statusBreakdown.map((item) => [item.status, item._count._all])) as Partial<Record<TaskStatus, number>>;

  const allTasksHref = createPageHref("/dashboard/tasks", resolvedSearchParams, {
    q: "",
    status: "",
    priority: "",
    assignedTo: "",
    page: "",
  });
  const assignedToMeHref = createPageHref("/dashboard/tasks", resolvedSearchParams, {
    assignedTo: user.id,
    page: "",
  });
  const completedHref = createPageHref("/dashboard/tasks", resolvedSearchParams, {
    status: "DONE",
    page: "",
  });
  const boardHref = createPageHref("/dashboard/tasks", resolvedSearchParams, { view: "board", page: "" });
  const listHref = createPageHref("/dashboard/tasks", resolvedSearchParams, { view: "list", page: "" });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[2rem] font-bold tracking-tight text-slate-900 dark:text-white">
            {t("Task Manager")}
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            {t("Keep follow-ups, internal work, and client delivery in one clean execution queue with real task ownership and due dates.")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild variant="secondary" className="h-[2.6rem] rounded-xl font-medium">
            <Link href="/dashboard/meetings">
              <CalendarDays className="mr-2 h-4 w-4" />
              {t("Calendar")}
            </Link>
          </Button>

          <TaskDialog
            users={users}
            clients={clients}
            leads={leads}
            deals={deals}
            showLinkedRecords
            defaults={{ assignedToId: user.id }}
            defaultDueDate={toDateInputValue(defaultDueDate)}
            triggerLabel={t("Add task")}
            triggerVariant="primary"
            triggerClassName="h-[2.6rem] rounded-xl px-5 font-semibold shadow-sm"
          />
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-slate-200 bg-white/60 p-4 backdrop-blur-xl shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 pb-4 dark:border-slate-800/50">
          <nav className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <FilterTab href={allTasksHref} label={t("All tasks")} count={totalAccessibleTasks} active={!status && !priority && !assignee && !query} />
            <FilterTab href={assignedToMeHref} label={t("Assigned to me")} count={assignedToMeCount} active={assignee === user.id} />
            <FilterTab href={completedHref} label={t("Completed")} count={statusCountMap.DONE ?? 0} active={status === "DONE"} />
          </nav>

          <div className="flex shrink-0 items-center gap-1 rounded-xl bg-slate-100/80 p-1 dark:bg-slate-800/60">
            <ViewLink href={boardHref} active={view === "board"} icon={<LayoutGrid className="h-4 w-4" />}>
              {t("Board")}
            </ViewLink>
            <ViewLink href={listHref} active={view === "list"} icon={<Rows3 className="h-4 w-4" />}>
              {t("List")}
            </ViewLink>
          </div>
        </div>

        <form className="mt-4 flex flex-wrap items-center gap-3">
          <input type="hidden" name="view" value={view} />
          
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              name="q"
              defaultValue={query}
              placeholder={t("Search tasks...")}
              className="h-10 w-full rounded-[1rem] border-slate-200 bg-white pl-10 text-sm shadow-none focus-visible:ring-1 focus-visible:ring-[var(--ui-brand)] dark:border-slate-700/60 dark:bg-slate-950/50"
            />
          </div>

          <Select name="status" defaultValue={status} className="h-10 w-[140px] rounded-[1rem] border-slate-200 bg-white shadow-none dark:border-slate-700/60 dark:bg-slate-950/50">
            <option value="">{t("All statuses")}</option>
            <option value="TODO">{t("TODO")}</option>
            <option value="IN_PROGRESS">{t("IN_PROGRESS")}</option>
            <option value="DONE">{t("DONE")}</option>
          </Select>

          <Select name="priority" defaultValue={priority} className="h-10 w-[140px] rounded-[1rem] border-slate-200 bg-white shadow-none dark:border-slate-700/60 dark:bg-slate-950/50">
            <option value="">{t("All priorities")}</option>
            <option value="LOW">{t("LOW")}</option>
            <option value="MEDIUM">{t("MEDIUM")}</option>
            <option value="HIGH">{t("HIGH")}</option>
          </Select>

          <Select name="assignedTo" defaultValue={assignee} className="h-10 w-[150px] rounded-[1rem] border-slate-200 bg-white shadow-none dark:border-slate-700/60 dark:bg-slate-950/50">
            <option value="">{t("All assignees")}</option>
            <option value="unassigned">{t("Unassigned")}</option>
            {users.map((teamUser) => (
              <option key={teamUser.id} value={teamUser.id}>
                {teamUser.name}
              </option>
            ))}
          </Select>

          <Select name="sort" defaultValue={sort} className="h-10 w-[160px] rounded-[1rem] border-slate-200 bg-white shadow-none dark:border-slate-700/60 dark:bg-slate-950/50">
            <option value="due-date">{t("Nearest due date")}</option>
            <option value="created-date">{t("Newest created")}</option>
            <option value="priority">{t("Highest priority")}</option>
          </Select>

          <Button type="submit" variant="secondary" className="h-10 rounded-[1rem] px-4 shadow-none">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            {t("Filter")}
          </Button>

          {(query || status || priority || assignee) && (
            <Button type="button" asChild variant="ghost" className="h-10 rounded-[1rem] px-4 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
              <Link href={allTasksHref}>{t("Clear")}</Link>
            </Button>
          )}
        </form>
      </div>

      <div>
        {view === "board" ? (
          <TaskWorkspaceBoard
            tasks={taskCards}
            currentUserId={user.id}
            users={users}
            clients={clients}
            leads={leads}
            deals={deals}
            t={t}
          />
        ) : (
          <TaskListBoard
            tasks={taskCards}
            currentUserId={user.id}
            users={users}
            clients={clients}
            leads={leads}
            deals={deals}
            emptyTitle={t(totalAccessibleTasks ? "No tasks matched your filters" : "No tasks yet")}
            emptyDescription={t(
              totalAccessibleTasks
                ? "Try a broader search, different filters, or create a task with a different owner or priority."
                : "Create the first task to start tracking follow-ups, internal work, and delivery deadlines in one place.",
            )}
          />
        )}
      </div>

      {view === "list" && pageCount > 1 && (
        <div className="flex items-center justify-between rounded-[1.25rem] border border-slate-200 bg-white px-5 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {t("Page {page} of {pageCount}", { page, pageCount })}
          </p>
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary" className="h-9 rounded-lg" disabled={page <= 1}>
              <Link aria-disabled={page <= 1} href={prevHref}>
                {t("Previous")}
              </Link>
            </Button>
            <Button asChild variant="secondary" className="h-9 rounded-lg" disabled={page >= pageCount}>
              <Link aria-disabled={page >= pageCount} href={nextHref}>
                {t("Next")}
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterTab({
  href,
  label,
  count,
  active = false,
}: {
  href: UrlObject;
  label: string;
  count: number;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex shrink-0 items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
        active
          ? "bg-slate-100/80 text-[var(--ui-brand-foreground)] shadow-[inset_0_1px_4px_rgba(0,0,0,0.02)] dark:bg-slate-800/80 dark:text-white"
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-white",
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "inline-flex h-5 items-center justify-center rounded-full px-2 text-[11px] font-semibold",
          active ? "bg-[var(--ui-brand)] text-white" : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
        )}
      >
        {count}
      </span>
    </Link>
  );
}

function ViewLink({
  href,
  active = false,
  icon,
  children,
}: {
  href: UrlObject | string;
  active?: boolean;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-[2.1rem] items-center gap-2 rounded-[0.5rem] px-3 text-[13px] font-medium transition",
        active
          ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700/80 dark:text-white dark:shadow-none"
          : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
      )}
    >
      {icon}
      {children}
    </Link>
  );
}
