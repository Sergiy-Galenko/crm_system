import { Prisma, type TaskPriority, type TaskStatus } from "@prisma/client";
import type { UrlObject } from "url";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCheck,
  ChevronRight,
  CircleEllipsis,
  Flag,
  LayoutGrid,
  ListTodo,
  Rows3,
  Search,
  SlidersHorizontal,
  UserRoundCheck,
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

const statusOrder = ["TODO", "IN_PROGRESS", "DONE"] as const;
const priorityOrder = ["HIGH", "MEDIUM", "LOW"] as const;

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

  const [tasks, totalTasks, clients, leads, deals, totalAccessibleTasks, statusBreakdown, priorityBreakdown, assignedToMeCount] = await Promise.all([
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
    prisma.task.groupBy({
      by: ["priority"],
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
  const priorityCountMap = Object.fromEntries(priorityBreakdown.map((item) => [item.priority, item._count._all])) as Partial<Record<TaskPriority, number>>;

  const selectedAssigneeName = assignee && assignee !== "unassigned"
    ? users.find((teamUser) => teamUser.id === assignee)?.name ?? null
    : null;

  const activeFilterSummary = [
    status ? t(status) : null,
    priority ? t(priority) : null,
    assignee === "unassigned"
      ? t("Unassigned")
      : selectedAssigneeName
        ? t("Assigned to {name}", { name: selectedAssigneeName })
        : null,
    query ? `“${query}”` : null,
  ].filter(Boolean);

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
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[2.4rem] border border-white/8 bg-[#0f1012] text-white shadow-[0_34px_110px_rgba(0,0,0,0.4)]">
        <div className="grid xl:grid-cols-[288px_minmax(0,1fr)]">
          <aside className="border-b border-white/6 bg-[#151619] px-4 py-5 sm:px-5 xl:min-h-[calc(100vh-13rem)] xl:border-b-0 xl:border-r">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/34">{t("Workspace")}</p>
                <h1 className="mt-3 text-[2rem] font-semibold tracking-tight text-white">{t("Tasks")}</h1>
              </div>
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/72">
                <BriefcaseBusiness className="h-5 w-5" />
              </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-white/46">
              {t("Keep follow-ups, internal work, and client delivery in one clean execution queue with real task ownership and due dates.")}
            </p>

            <nav className="mt-7 space-y-1.5">
              <WorkspaceLink
                href={allTasksHref}
                label={t("All tasks")}
                count={totalAccessibleTasks}
                active={!status && !priority && !assignee && !query}
                icon={<ListTodo className="h-4 w-4" />}
              />
              <WorkspaceLink
                href={assignedToMeHref}
                label={t("Assigned to {name}", { name: user.name.split(" ")[0] || user.name })}
                count={assignedToMeCount}
                active={assignee === user.id}
                icon={<UserRoundCheck className="h-4 w-4" />}
              />
              <WorkspaceLink
                href={completedHref}
                label={t("Completed")}
                count={statusCountMap.DONE ?? 0}
                active={status === "DONE"}
                icon={<CheckCheck className="h-4 w-4" />}
              />
            </nav>

            <div className="mt-7 space-y-6 border-t border-white/6 pt-6">
              <SidebarBlock title={t("Status")}>
                {statusOrder.map((statusItem) => (
                  <WorkspaceLink
                    key={statusItem}
                    href={createPageHref("/dashboard/tasks", resolvedSearchParams, { status: statusItem, page: "" })}
                    label={t(statusItem)}
                    count={statusCountMap[statusItem] ?? 0}
                    active={status === statusItem}
                    icon={<CircleEllipsis className="h-4 w-4" />}
                    compact
                  />
                ))}
              </SidebarBlock>

              <SidebarBlock title={t("Priority")}>
                {priorityOrder.map((priorityItem) => (
                  <WorkspaceLink
                    key={priorityItem}
                    href={createPageHref("/dashboard/tasks", resolvedSearchParams, { priority: priorityItem, page: "" })}
                    label={t(priorityItem)}
                    count={priorityCountMap[priorityItem] ?? 0}
                    active={priority === priorityItem}
                    icon={<Flag className="h-4 w-4" />}
                    compact
                  />
                ))}
              </SidebarBlock>
            </div>
          </aside>

          <div className="min-w-0">
            <div className="border-b border-white/6 px-5 py-5 sm:px-6">
              <div className="space-y-5">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-white/38">
                      <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-white/76">
                        {t("Workspace")}
                      </span>
                      <ChevronRight className="h-4 w-4" />
                      <span>{t("Tasks")}</span>
                      <ChevronRight className="h-4 w-4" />
                      <span className="text-white">{t("Task Manager")}</span>
                    </div>

                    <h2 className="mt-4 text-[2rem] font-semibold tracking-tight text-white sm:text-[2.4rem]">
                      {t("Task Manager")}
                    </h2>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-white/48">
                      {t("Keep follow-ups, internal work, and client delivery in one clean execution queue with real task ownership and due dates.")}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <ViewLink href={boardHref} active={view === "board"} icon={<LayoutGrid className="h-4 w-4" />}>
                      {t("Board")}
                    </ViewLink>
                    <ViewLink href={listHref} active={view === "list"} icon={<Rows3 className="h-4 w-4" />}>
                      {t("List")}
                    </ViewLink>
                    <ViewLink href="/dashboard/meetings" icon={<CalendarDays className="h-4 w-4" />}>
                      {t("Calendar")}
                    </ViewLink>
                    <TaskDialog
                      users={users}
                      clients={clients}
                      leads={leads}
                      deals={deals}
                      showLinkedRecords
                      defaults={{ assignedToId: user.id }}
                      defaultDueDate={toDateInputValue(defaultDueDate)}
                      triggerLabel="Add task"
                      triggerClassName="rounded-2xl border border-violet-500/30 bg-[linear-gradient(135deg,#7c3aed,#5b21b6)] px-5 text-white shadow-[0_14px_32px_rgba(91,33,182,0.35)] hover:border-violet-400/40 hover:bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)]"
                    />
                  </div>
                </div>

                <form className="grid gap-3 xl:grid-cols-[minmax(0,1.65fr)_155px_155px_205px_165px_auto_auto] xl:items-center">
                  <input type="hidden" name="view" value={view} />
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/34" />
                    <Input
                      name="q"
                      aria-label={t("Search")}
                      defaultValue={query}
                      placeholder={t("Search task title or description")}
                      className="h-11 rounded-[1.1rem] border-white/10 bg-[#181a1f] pl-10 text-white shadow-none placeholder:text-white/26 hover:border-white/16 hover:bg-[#1c1f24] focus:border-violet-400/30 focus:bg-[#1c1f24]"
                    />
                  </div>

                  <Select
                    name="status"
                    aria-label={t("Status")}
                    defaultValue={status}
                    className="h-11 rounded-[1.1rem] border-white/10 bg-[#181a1f] text-white shadow-none hover:border-white/16 hover:bg-[#1c1f24] focus:border-violet-400/30 focus:bg-[#1c1f24]"
                  >
                    <option value="">{t("All statuses")}</option>
                    <option value="TODO">{t("TODO")}</option>
                    <option value="IN_PROGRESS">{t("IN_PROGRESS")}</option>
                    <option value="DONE">{t("DONE")}</option>
                  </Select>

                  <Select
                    name="priority"
                    aria-label={t("Priority")}
                    defaultValue={priority}
                    className="h-11 rounded-[1.1rem] border-white/10 bg-[#181a1f] text-white shadow-none hover:border-white/16 hover:bg-[#1c1f24] focus:border-violet-400/30 focus:bg-[#1c1f24]"
                  >
                    <option value="">{t("All priorities")}</option>
                    <option value="LOW">{t("LOW")}</option>
                    <option value="MEDIUM">{t("MEDIUM")}</option>
                    <option value="HIGH">{t("HIGH")}</option>
                  </Select>

                  <Select
                    name="assignedTo"
                    aria-label={t("Assignee")}
                    defaultValue={assignee}
                    className="h-11 rounded-[1.1rem] border-white/10 bg-[#181a1f] text-white shadow-none hover:border-white/16 hover:bg-[#1c1f24] focus:border-violet-400/30 focus:bg-[#1c1f24]"
                  >
                    <option value="">{t("All assignees")}</option>
                    <option value="unassigned">{t("Unassigned")}</option>
                    {users.map((teamUser) => (
                      <option key={teamUser.id} value={teamUser.id}>
                        {teamUser.email ? `${teamUser.name} · ${teamUser.email}` : teamUser.name}
                      </option>
                    ))}
                  </Select>

                  <Select
                    name="sort"
                    aria-label={t("Sort by")}
                    defaultValue={sort}
                    className="h-11 rounded-[1.1rem] border-white/10 bg-[#181a1f] text-white shadow-none hover:border-white/16 hover:bg-[#1c1f24] focus:border-violet-400/30 focus:bg-[#1c1f24]"
                  >
                    <option value="due-date">{t("Nearest due date")}</option>
                    <option value="created-date">{t("Newest created")}</option>
                    <option value="priority">{t("Highest priority")}</option>
                  </Select>

                  <Button type="submit" className="h-11 rounded-[1.1rem] border border-white/10 bg-white/6 px-4 text-white shadow-none hover:border-white/16 hover:bg-white/10">
                    <SlidersHorizontal className="h-4 w-4" />
                    {t("Filter")}
                  </Button>

                  <Button asChild variant="ghost" className="h-11 rounded-[1.1rem] border border-transparent px-4 text-white/62 hover:border-white/10 hover:bg-white/6 hover:text-white">
                    <Link href={allTasksHref}>{t("Clear filters")}</Link>
                  </Button>
                </form>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-b border-white/6 px-5 py-4 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/22 bg-violet-500/14 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-violet-200">
                  <LayoutGrid className="h-3.5 w-3.5" />
                  {view === "board" ? t("Board") : t("List")}
                </span>
                {activeFilterSummary.length ? activeFilterSummary.map((item) => (
                  <span key={item} className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/62">
                    {item}
                  </span>
                )) : (
                  <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/48">
                    {t("All workspace tasks")}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-white/30">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  <ListTodo className="h-3.5 w-3.5" />
                  {totalTasks}
                </span>
              </div>
            </div>

            <div className="p-5 sm:p-6">
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
                  layout="workspace"
                  emptyTitle={t(totalAccessibleTasks ? "No tasks matched your filters" : "No tasks yet")}
                  emptyDescription={t(
                    totalAccessibleTasks
                      ? "Try a broader search, different filters, or create a task with a different owner or priority."
                      : "Create the first task to start tracking follow-ups, internal work, and delivery deadlines in one place.",
                  )}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {view === "list" && pageCount > 1 ? (
        <div className="flex items-center justify-between rounded-[1.65rem] border border-white/8 bg-[#101114] px-4 py-3 text-white shadow-[0_16px_38px_rgba(0,0,0,0.22)]">
          <p className="text-sm text-white/44">
            {t("Page {page} of {pageCount}", { page, pageCount })}
          </p>
          <div className="flex items-center gap-2">
            <Button asChild className="h-10 rounded-xl border border-white/10 bg-white/6 px-4 text-white shadow-none hover:border-white/16 hover:bg-white/10" disabled={page <= 1}>
              <Link aria-disabled={page <= 1} href={prevHref}>
                {t("Previous")}
              </Link>
            </Button>
            <Button asChild className="h-10 rounded-xl border border-white/10 bg-white/6 px-4 text-white shadow-none hover:border-white/16 hover:bg-white/10" disabled={page >= pageCount}>
              <Link aria-disabled={page >= pageCount} href={nextHref}>
                {t("Next")}
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SidebarBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <p className="px-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white/30">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

function WorkspaceLink({
  href,
  label,
  count,
  icon,
  active = false,
  compact = false,
}: {
  href: UrlObject;
  label: string;
  count: number;
  icon: ReactNode;
  active?: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center justify-between gap-3 rounded-[1.15rem] border px-3.5 py-3 transition",
        compact ? "bg-transparent" : "",
        active
          ? "border-violet-500/28 bg-violet-500/15 text-white shadow-[0_16px_34px_rgba(91,33,182,0.18)]"
          : "border-transparent bg-transparent text-white/58 hover:border-white/8 hover:bg-white/5 hover:text-white",
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className={cn("inline-flex items-center justify-center rounded-xl", compact ? "h-8 w-8 bg-white/5 text-white/42" : "h-10 w-10 bg-white/5 text-white/48", active ? "bg-white/10 text-white" : "")}>
          {icon}
        </span>
        <span className="truncate text-sm font-medium">{label}</span>
      </span>
      <span className={cn("text-sm font-semibold", active ? "text-white" : "text-white/32")}>{count}</span>
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
        "inline-flex h-11 items-center gap-2 rounded-[1.1rem] border px-4 text-sm font-medium transition",
        active
          ? "border-white/14 bg-white/10 text-white shadow-[0_12px_30px_rgba(0,0,0,0.18)]"
          : "border-white/8 bg-transparent text-white/52 hover:border-white/12 hover:bg-white/5 hover:text-white",
      )}
    >
      {icon}
      {children}
    </Link>
  );
}
