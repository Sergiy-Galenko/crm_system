import { Prisma, type TaskPriority, type TaskStatus } from "@prisma/client";
import Link from "next/link";
import { CalendarClock, EllipsisVertical, ListTodo, Search, Sparkles } from "lucide-react";
import { deleteTaskAction, restoreTaskAction, updateTaskStatusAction } from "@/actions/tasks";
import { TaskDialog } from "@/components/forms/task-dialog";
import { StatusBadge } from "@/components/status-badge";
import { UserAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { clientAccessWhere, dealAccessWhere, leadAccessWhere, taskAccessWhere, visibleUsersWhere } from "@/lib/crm-scope";
import { prisma } from "@/lib/db";
import { taskPriorities, taskStatuses } from "@/lib/constants";
import { getServerTranslator } from "@/lib/locale-server";
import { createPageHref, getPage, getParam, type SearchParamsRecord } from "@/lib/query-params";
import { requireUser } from "@/lib/session";
import { formatDate, fromNow, toDateInputValue } from "@/lib/utils";

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

  const [tasks, totalTasks, clients, leads, deals, totalAccessibleTasks] = await Promise.all([
    prisma.task.findMany({
      ...taskListArgs,
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
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
  ]);
  const taskItems: TaskListItem[] = tasks;

  const pageCount = Math.max(1, Math.ceil(totalTasks / pageSize));
  const prevHref = createPageHref("/dashboard/tasks", resolvedSearchParams, { page: String(Math.max(1, page - 1)) });
  const nextHref = createPageHref("/dashboard/tasks", resolvedSearchParams, { page: String(Math.min(pageCount, page + 1)) });

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[2.4rem] border border-[var(--ui-border)] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--ui-surface-solid)_92%,transparent),color-mix(in_srgb,var(--ui-surface-muted)_100%,transparent))] shadow-[var(--ui-shadow-soft)]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-8 top-8 h-32 w-32 rounded-full bg-[color-mix(in_srgb,var(--ui-brand)_9%,transparent)] blur-3xl" />
          <div className="absolute bottom-[-3rem] right-[-2rem] h-40 w-40 rounded-full bg-[color-mix(in_srgb,var(--ui-ring)_55%,transparent)] blur-3xl" />
        </div>

        <div className="relative grid gap-6 px-5 py-6 sm:px-6 sm:py-7 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
          <div className="max-w-3xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--ui-text-soft)]">{t("Execution desk")}</p>
            <h1 className="mt-3 text-[2.65rem] font-semibold tracking-tight text-[var(--ui-text-strong)] sm:text-[3.2rem]">
              {t("Task Manager")}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--ui-text-muted)]">
              {t("Keep follow-ups, internal work, and client delivery in one clean execution queue with real task ownership and due dates.")}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] px-4 py-2 text-sm font-medium text-[var(--ui-text)] shadow-[var(--ui-shadow-xs)]">
                <ListTodo className="h-4 w-4 text-[var(--ui-text-soft)]" />
                <span>{t("All tasks")}: {totalAccessibleTasks}</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[color-mix(in_srgb,var(--ui-surface-muted)_92%,transparent)] px-4 py-2 text-sm text-[var(--ui-text-muted)]">
                <Sparkles className="h-4 w-4 text-[var(--ui-text-soft)]" />
                <span>{t("Every task visible in your workspace.")}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[1.9rem] border border-[var(--ui-border)] bg-[color-mix(in_srgb,var(--ui-surface-solid)_86%,transparent)] p-4 shadow-[var(--ui-shadow-xs)] backdrop-blur xl:p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--ui-text-soft)]">{t("Focused queue")}</p>
            <p className="mt-2 text-xl font-semibold tracking-tight text-[var(--ui-text-strong)]">{t("Add task")}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--ui-text-muted)]">
              {t("Add just enough context so the assignee knows the next move.")}
            </p>
            <div className="mt-4">
              <TaskDialog
                users={users}
                clients={clients}
                leads={leads}
                deals={deals}
                showLinkedRecords
                defaults={{ assignedToId: user.id }}
                defaultDueDate={toDateInputValue(defaultDueDate)}
                triggerLabel="Add task"
              />
            </div>
          </div>
        </div>

        <form className="relative grid gap-3 border-t border-[var(--ui-border)] px-5 py-5 sm:px-6 xl:grid-cols-[minmax(0,1.35fr)_180px_180px_220px_190px_auto_auto] xl:items-end">
          <FormBlock label={t("Search")}>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ui-text-soft)]" />
              <Input
                name="q"
                defaultValue={query}
                placeholder={t("Search task title or description")}
                className="h-12 rounded-[1.15rem] pl-10 shadow-none"
              />
            </div>
          </FormBlock>
          <FormBlock label={t("Status")}>
            <Select name="status" defaultValue={status} className="h-12 rounded-[1.15rem] shadow-none">
              <option value="">{t("All statuses")}</option>
              <option value="TODO">{t("TODO")}</option>
              <option value="IN_PROGRESS">{t("IN_PROGRESS")}</option>
              <option value="DONE">{t("DONE")}</option>
            </Select>
          </FormBlock>
          <FormBlock label={t("Priority")}>
            <Select name="priority" defaultValue={priority} className="h-12 rounded-[1.15rem] shadow-none">
              <option value="">{t("All priorities")}</option>
              <option value="LOW">{t("LOW")}</option>
              <option value="MEDIUM">{t("MEDIUM")}</option>
              <option value="HIGH">{t("HIGH")}</option>
            </Select>
          </FormBlock>
          <FormBlock label={t("Assignee")}>
            <Select name="assignedTo" defaultValue={assignee} className="h-12 rounded-[1.15rem] shadow-none">
              <option value="">{t("All assignees")}</option>
              <option value="unassigned">{t("Unassigned")}</option>
              {users.map((teamUser) => (
                <option key={teamUser.id} value={teamUser.id}>
                  {teamUser.email ? `${teamUser.name} · ${teamUser.email}` : teamUser.name}
                </option>
              ))}
            </Select>
          </FormBlock>
          <FormBlock label={t("Sort by")}>
            <Select name="sort" defaultValue={sort} className="h-12 rounded-[1.15rem] shadow-none">
              <option value="due-date">{t("Nearest due date")}</option>
              <option value="created-date">{t("Newest created")}</option>
              <option value="priority">{t("Highest priority")}</option>
            </Select>
          </FormBlock>
          <Button type="submit" variant="secondary" className="h-12 rounded-[1.15rem]">
            {t("Filter")}
          </Button>
          <Button asChild variant="ghost" className="h-12 rounded-[1.15rem]">
            <Link href="/dashboard/tasks">{t("Clear filters")}</Link>
          </Button>
        </form>
      </section>

      {taskItems.length ? (
        <div className="space-y-4">
          {taskItems.map((task) => (
            <article
              key={task.id}
              className="rounded-[2rem] border border-[var(--ui-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--ui-surface-solid)_94%,transparent),color-mix(in_srgb,var(--ui-surface-muted)_100%,transparent))] p-5 shadow-[var(--ui-shadow-xs)]"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-[var(--ui-text-strong)]">{task.title}</h3>
                    <StatusBadge value={task.status} />
                    <StatusBadge value={task.priority} />
                    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] px-3 py-1 text-xs font-medium text-[var(--ui-text-muted)] shadow-[var(--ui-shadow-xs)]">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {t("Due")} {formatDate(task.dueDate, locale)}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2.5">
                    {task.assignedTo ? (
                      <div className="inline-flex min-w-0 items-center gap-3 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] px-3 py-2 shadow-[var(--ui-shadow-xs)]">
                        <UserAvatar
                          name={task.assignedTo.name}
                          color={task.assignedTo.avatarColor}
                          imageUrl={task.assignedTo.companyLogoUrl}
                          className="h-9 w-9 rounded-full"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[var(--ui-text-strong)]">{task.assignedTo.name}</p>
                          <p className="truncate text-xs text-[var(--ui-text-muted)]">
                            {task.assignedTo.email ?? (task.assignedTo.nickname ? `@${task.assignedTo.nickname}` : t("Assigned to {name}", { name: task.assignedTo.name }))}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="inline-flex min-w-0 items-center gap-2 rounded-full border border-dashed border-[var(--ui-border)] bg-[color-mix(in_srgb,var(--ui-surface-muted)_92%,transparent)] px-3 py-2 text-sm font-medium text-[var(--ui-text-muted)]">
                        <span className="inline-block h-2 w-2 rounded-full bg-[var(--ui-text-soft)]" />
                        {t("Unassigned")}
                      </div>
                    )}
                    {task.client ? (
                      <Link
                        href={`/dashboard/clients/${task.client.id}`}
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] px-3 py-2 text-sm text-[var(--ui-text-muted)] shadow-[var(--ui-shadow-xs)] transition hover:bg-[var(--ui-surface-hover)] hover:text-[var(--ui-text-strong)]"
                      >
                        {t("Client")}: {task.client.company}
                      </Link>
                    ) : null}
                    {task.lead ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] px-3 py-2 text-sm text-[var(--ui-text-muted)] shadow-[var(--ui-shadow-xs)]">
                        {t("Lead")}: {task.lead.company}
                      </span>
                    ) : null}
                    {task.deal ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] px-3 py-2 text-sm text-[var(--ui-text-muted)] shadow-[var(--ui-shadow-xs)]">
                        {t("Deal")}: {task.deal.title}
                      </span>
                    ) : null}
                  </div>

                  {task.description ? (
                    <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--ui-text-muted)]">{task.description}</p>
                  ) : null}

                  <p className="mt-4 text-xs uppercase tracking-[0.14em] text-[var(--ui-text-soft)]">
                    {t("Updated {time}", { time: fromNow(task.updatedAt, locale) })}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 xl:w-auto xl:justify-end">
                  {task.status === "TODO" ? (
                    <form action={updateTaskStatusAction.bind(null, task.id, "IN_PROGRESS")}>
                      <Button type="submit" variant="secondary" size="sm" className="rounded-xl">
                        {t("Start work")}
                      </Button>
                    </form>
                  ) : null}
                  {task.status !== "DONE" ? (
                    <form action={updateTaskStatusAction.bind(null, task.id, "DONE")}>
                      <Button type="submit" variant="secondary" size="sm" className="rounded-xl">
                        {t("Complete")}
                      </Button>
                    </form>
                  ) : (
                    <form action={restoreTaskAction.bind(null, task.id)}>
                      <Button type="submit" variant="subtle" size="sm" className="rounded-xl">
                        {t("Return to active")}
                      </Button>
                    </form>
                  )}
                  <TaskDialog
                    users={users}
                    clients={clients}
                    leads={leads}
                    deals={deals}
                    showLinkedRecords
                    task={{
                      id: task.id,
                      title: task.title,
                      description: task.description,
                      status: task.status,
                      priority: task.priority,
                      dueDate: task.dueDate,
                      assignedToId: task.assignedToId ?? undefined,
                      tags: task.tags,
                      clientId: task.clientId,
                      leadId: task.leadId,
                      dealId: task.dealId,
                    }}
                    triggerLabel="Edit"
                  />
                  <TaskActionMenu taskId={task.id} status={task.status} t={t} />
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title={t(totalAccessibleTasks ? "No tasks matched your filters" : "No tasks yet")}
          description={t(
            totalAccessibleTasks
              ? "Try a broader search, different filters, or create a task with a different owner or priority."
              : "Create the first task to start tracking follow-ups, internal work, and delivery deadlines in one place.",
          )}
        />
      )}

      {pageCount > 1 ? (
        <Pagination
          page={page}
          pageCount={pageCount}
          prevHref={prevHref}
          nextHref={nextHref}
        />
      ) : null}
    </div>
  );
}

function FormBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium text-[var(--ui-text-muted)]">{label}</span>
      {children}
    </label>
  );
}

function TaskActionMenu({
  taskId,
  status,
  t,
}: {
  taskId: string;
  status: string;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="rounded-2xl">
          <EllipsisVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
        <DropdownMenuLabel>{t("Task actions")}</DropdownMenuLabel>
        {status !== "TODO" ? (
          <form action={updateTaskStatusAction.bind(null, taskId, "TODO")}>
            <TaskMenuActionButton>{t("Move to TODO")}</TaskMenuActionButton>
          </form>
        ) : null}
        {status !== "IN_PROGRESS" ? (
          <form action={updateTaskStatusAction.bind(null, taskId, "IN_PROGRESS")}>
            <TaskMenuActionButton>{t("Move to IN_PROGRESS")}</TaskMenuActionButton>
          </form>
        ) : null}
        {status !== "DONE" ? (
          <form action={updateTaskStatusAction.bind(null, taskId, "DONE")}>
            <TaskMenuActionButton>{t("Mark as done")}</TaskMenuActionButton>
          </form>
        ) : (
          <form action={restoreTaskAction.bind(null, taskId)}>
            <TaskMenuActionButton>{t("Return to active")}</TaskMenuActionButton>
          </form>
        )}
        <DropdownMenuSeparator />
        <form action={deleteTaskAction.bind(null, taskId)}>
          <TaskMenuActionButton danger>{t("Delete task")}</TaskMenuActionButton>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TaskMenuActionButton({
  children,
  danger = false,
}: {
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="submit"
      className={[
        "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition",
        danger
          ? "text-rose-600 hover:bg-rose-50"
          : "text-[var(--ui-text)] hover:bg-[var(--ui-surface-muted)]",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
