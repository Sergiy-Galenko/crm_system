import type { Prisma, TaskPriority, TaskStatus } from "@prisma/client";
import Link from "next/link";
import { CalendarClock, EllipsisVertical, Link2 } from "lucide-react";
import { deleteTaskAction, restoreTaskAction, updateTaskStatusAction } from "@/actions/tasks";
import { TaskDialog } from "@/components/forms/task-dialog";
import { MetricCard } from "@/components/metric-card";
import { PageHeader } from "@/components/page-header";
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
import { formatDate, fromNow } from "@/lib/utils";

const pageSize = 10;

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
  const baseWhere = taskAccessWhere(user);
  const where: Prisma.TaskWhereInput = {
    ...baseWhere,
    ...(assignee === "unassigned" ? { assignedToId: null } : assignee ? { assignedToId: assignee } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(status ? { status: status as TaskStatus } : {}),
    ...(priority ? { priority: priority as TaskPriority } : {}),
  };

  const orderBy: Prisma.TaskOrderByWithRelationInput[] =
    sort === "created-date"
      ? [{ createdAt: "desc" }]
      : sort === "priority"
        ? [{ priority: "desc" }, { dueDate: "asc" }]
        : [{ dueDate: "asc" }, { createdAt: "desc" }];

  const now = new Date();
  const [tasks, totalTasks, clients, leads, deals, totalAccessibleTasks, inProgressTasks, doneTasks, overdueTasks] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
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
        createdBy: {
          select: {
            id: true,
            name: true,
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
    prisma.task.count({
      where: {
        ...baseWhere,
        status: "IN_PROGRESS",
      },
    }),
    prisma.task.count({
      where: {
        ...baseWhere,
        status: "DONE",
      },
    }),
    prisma.task.count({
      where: {
        ...baseWhere,
        status: {
          not: "DONE",
        },
        dueDate: {
          lt: now,
        },
      },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(totalTasks / pageSize));
  const prevHref = createPageHref("/dashboard/tasks", resolvedSearchParams, { page: String(Math.max(1, page - 1)) });
  const nextHref = createPageHref("/dashboard/tasks", resolvedSearchParams, { page: String(Math.min(pageCount, page + 1)) });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("Execution desk")}
        title={t("Task Manager")}
        description={t("Keep follow-ups, internal work, and client delivery in one clean execution queue with real task ownership and due dates.")}
        actions={(
          <TaskDialog
            users={users}
            clients={clients}
            leads={leads}
            deals={deals}
            showLinkedRecords
            defaults={{ assignedToId: user.id }}
            triggerLabel="Add task"
          />
        )}
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <MetricCard
          label={t("All tasks")}
          value={String(totalAccessibleTasks)}
          meta={t("Every task visible in your workspace.")}
        />
        <MetricCard
          label={t("In progress")}
          value={String(inProgressTasks)}
          meta={t("Tasks actively moving right now.")}
        />
        <MetricCard
          label={t("Completed")}
          value={String(doneTasks)}
          meta={t("Finished tasks across the team.")}
          tone="brand"
        />
        <MetricCard
          label={t("Overdue")}
          value={String(overdueTasks)}
          meta={t("Active tasks past their due date.")}
        />
      </div>

      <div className="card rounded-[2rem] p-5">
        <form className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_220px_220px_220px_220px_auto_auto] xl:items-end">
          <FormBlock label={t("Search")}>
            <Input
              name="q"
              defaultValue={query}
              placeholder={t("Search task title or description")}
            />
          </FormBlock>
          <FormBlock label={t("Status")}>
            <Select name="status" defaultValue={status}>
              <option value="">{t("All statuses")}</option>
              <option value="TODO">{t("TODO")}</option>
              <option value="IN_PROGRESS">{t("IN_PROGRESS")}</option>
              <option value="DONE">{t("DONE")}</option>
            </Select>
          </FormBlock>
          <FormBlock label={t("Priority")}>
            <Select name="priority" defaultValue={priority}>
              <option value="">{t("All priorities")}</option>
              <option value="LOW">{t("LOW")}</option>
              <option value="MEDIUM">{t("MEDIUM")}</option>
              <option value="HIGH">{t("HIGH")}</option>
            </Select>
          </FormBlock>
          <FormBlock label={t("Assignee")}>
            <Select name="assignedTo" defaultValue={assignee}>
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
            <Select name="sort" defaultValue={sort}>
              <option value="due-date">{t("Nearest due date")}</option>
              <option value="created-date">{t("Newest created")}</option>
              <option value="priority">{t("Highest priority")}</option>
            </Select>
          </FormBlock>
          <Button type="submit" variant="secondary">
            {t("Filter")}
          </Button>
          <Button asChild variant="ghost">
            <Link href="/dashboard/tasks">{t("Clear filters")}</Link>
          </Button>
        </form>
      </div>

      {tasks.length ? (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="card rounded-[2rem] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-950">{task.title}</h3>
                    <StatusBadge value={task.status} />
                    <StatusBadge value={task.priority} />
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {t("Due")} {formatDate(task.dueDate, locale)}
                    </span>
                  </div>

                  <div className="mt-4">
                    {task.assignedTo ? (
                      <div className="inline-flex min-w-0 items-center gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50/80 px-3 py-2.5">
                        <UserAvatar
                          name={task.assignedTo.name}
                          color={task.assignedTo.avatarColor}
                          imageUrl={task.assignedTo.companyLogoUrl}
                          className="h-10 w-10 rounded-xl"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">{task.assignedTo.name}</p>
                          <p className="truncate text-xs text-slate-500">
                            {task.assignedTo.email ?? (task.assignedTo.nickname ? `@${task.assignedTo.nickname}` : t("Assigned to {name}", { name: task.assignedTo.name }))}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="inline-flex min-w-0 flex-col rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50/70 px-3 py-2.5">
                        <p className="text-sm font-medium text-slate-900">{t("Unassigned")}</p>
                        <p className="text-xs text-slate-500">{t("Assign an owner when this work is ready to route.")}</p>
                      </div>
                    )}
                  </div>

                  {task.description ? (
                    <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">{task.description}</p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-500">
                    {task.client ? (
                      <Link
                        href={`/dashboard/clients/${task.client.id}`}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 transition hover:bg-slate-50 hover:text-slate-900"
                      >
                        <Link2 className="h-3.5 w-3.5" />
                        {t("Client")}: {task.client.company}
                      </Link>
                    ) : null}
                    {task.lead ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                        <Link2 className="h-3.5 w-3.5" />
                        {t("Lead")}: {task.lead.company}
                      </span>
                    ) : null}
                    {task.deal ? (
                      <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                        <Link2 className="h-3.5 w-3.5" />
                        {t("Deal")}: {task.deal.title}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-4 text-xs uppercase tracking-[0.14em] text-slate-400">
                    {t("Updated {time}", { time: fromNow(task.updatedAt, locale) })} • {t("Created by {name}", { name: task.createdBy.name })}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 lg:w-[15rem] lg:justify-end">
                  {task.status === "TODO" ? (
                    <form action={updateTaskStatusAction.bind(null, task.id, "IN_PROGRESS")}>
                      <Button type="submit" variant="secondary" size="sm">
                        {t("Start work")}
                      </Button>
                    </form>
                  ) : null}
                  {task.status !== "DONE" ? (
                    <form action={updateTaskStatusAction.bind(null, task.id, "DONE")}>
                      <Button type="submit" variant="secondary" size="sm">
                        {t("Complete")}
                      </Button>
                    </form>
                  ) : (
                    <form action={restoreTaskAction.bind(null, task.id)}>
                      <Button type="submit" variant="subtle" size="sm">
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
            </div>
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

      <Pagination
        page={page}
        pageCount={pageCount}
        prevHref={prevHref}
        nextHref={nextHref}
      />
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
      <span className="font-medium text-slate-600">{label}</span>
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
          : "text-slate-700 hover:bg-slate-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
