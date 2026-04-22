import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ActivityAction, ActivityEntity, Prisma, TaskStatus } from "@prisma/client";
import { ActivityLogService } from "@backend/common/activity/activity-log.service";
import type { RequestUser } from "@backend/common/auth/request-user.interface";
import { PrismaService } from "@backend/common/database/prisma.service";
import { clientAccessWhere, dealAccessWhere, leadAccessWhere, taskAccessWhere, visibleUsersWhere } from "@backend/common/scope/crm-scope";
import type { TaskSortOption } from "./dto/list-tasks.dto";
import { ListTasksDto } from "./dto/list-tasks.dto";
import { UpsertTaskDto } from "./dto/upsert-task.dto";

function getTaskOrderBy(sort: TaskSortOption | undefined): Prisma.TaskOrderByWithRelationInput[] {
  if (sort === "created-date") {
    return [{ createdAt: "desc" }];
  }

  if (sort === "priority") {
    return [{ priority: "desc" }, { dueDate: "asc" }];
  }

  return [{ dueDate: "asc" }, { createdAt: "desc" }];
}

const taskAssigneeSelect = {
  id: true,
  name: true,
  email: true,
  nickname: true,
  avatarColor: true,
  companyLogoUrl: true,
} satisfies Prisma.UserSelect;

const taskCreatorSelect = {
  id: true,
  name: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async getTasks(user: RequestUser, dto: ListTasksDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 12;
    const where: Prisma.TaskWhereInput = {
      ...taskAccessWhere(user),
    };

    if (dto.assignedTo === "unassigned") {
      where.assignedTo = null;
    } else if (dto.assignedTo) {
      const assignee = await this.prisma.user.findFirst({
        where: {
          id: dto.assignedTo,
          ...visibleUsersWhere(user),
        },
        select: { id: true },
      });

      if (!assignee) {
        throw new BadRequestException("That assignee is not in your team.");
      }

      where.assignedToId = dto.assignedTo;
    }

    if (dto.status) {
      where.status = dto.status;
    }

    if (dto.priority) {
      where.priority = dto.priority;
    }

    if (dto.search) {
      where.OR = [
        { title: { contains: dto.search, mode: "insensitive" } },
        { description: { contains: dto.search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        orderBy: getTaskOrderBy(dto.sort),
        skip: (page - 1) * limit,
        take: limit,
        include: {
          assignedTo: {
            select: taskAssigneeSelect,
          },
          createdBy: {
            select: taskCreatorSelect,
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
      this.prisma.task.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      pageCount: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getTaskById(user: RequestUser, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        ...taskAccessWhere(user),
      },
      include: {
        assignedTo: {
          select: taskAssigneeSelect,
        },
        createdBy: {
          select: taskCreatorSelect,
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

    if (!task) {
      throw new NotFoundException("Task not found.");
    }

    return task;
  }

  async upsertTask(user: RequestUser, dto: UpsertTaskDto) {
    const [assignee, client, lead, deal, existingTask] = await Promise.all([
      dto.assignedToId
        ? this.prisma.user.findFirst({
            where: {
              id: dto.assignedToId,
              ...visibleUsersWhere(user),
            },
            select: { id: true },
          })
        : Promise.resolve(null),
      dto.clientId
        ? this.prisma.client.findFirst({
            where: { id: dto.clientId, ...clientAccessWhere(user) },
            select: { id: true },
          })
        : Promise.resolve(null),
      dto.leadId
        ? this.prisma.lead.findFirst({
            where: { id: dto.leadId, ...leadAccessWhere(user) },
            select: { id: true },
          })
        : Promise.resolve(null),
      dto.dealId
        ? this.prisma.deal.findFirst({
            where: { id: dto.dealId, ...dealAccessWhere(user) },
            select: { id: true },
          })
        : Promise.resolve(null),
      dto.id
        ? this.prisma.task.findFirst({
            where: { id: dto.id, ...taskAccessWhere(user) },
            select: {
              id: true,
              clientId: true,
              status: true,
            },
          })
        : Promise.resolve(null),
    ]);

    if (dto.assignedToId && !assignee) {
      throw new BadRequestException("That assignee is not in your team.");
    }

    if (dto.clientId && !client) {
      throw new BadRequestException("That client is not available in your workspace.");
    }

    if (dto.leadId && !lead) {
      throw new BadRequestException("That lead is not available in your workspace.");
    }

    if (dto.dealId && !deal) {
      throw new BadRequestException("That deal is not available in your workspace.");
    }

    let previousClientId: string | null = null;
    let existingStatus: TaskStatus | null = null;

    if (dto.id) {
      if (!existingTask) {
        throw new ForbiddenException("You can only update tasks in your workspace.");
      }

      previousClientId = existingTask.clientId;
      existingStatus = existingTask.status;
    }

    const task = dto.id
      ? await this.prisma.task.update({
          where: { id: dto.id },
          data: {
            title: dto.title,
            description: dto.description || null,
            status: dto.status,
            priority: dto.priority,
            tags: dto.tags,
            dueDate: dto.dueDate,
            assignedToId: dto.assignedToId ?? null,
            clientId: dto.clientId || null,
            leadId: dto.leadId || null,
            dealId: dto.dealId || null,
            completedAt: dto.status === "DONE" ? new Date() : null,
          },
        })
      : await this.prisma.task.create({
          data: {
            title: dto.title,
            description: dto.description || null,
            status: dto.status,
            priority: dto.priority,
            tags: dto.tags,
            dueDate: dto.dueDate,
            assignedToId: dto.assignedToId ?? null,
            createdById: user.userId,
            clientId: dto.clientId || null,
            leadId: dto.leadId || null,
            dealId: dto.dealId || null,
            completedAt: dto.status === "DONE" ? new Date() : null,
          },
        });

    await this.activityLogService.log(this.prisma, {
      actorId: user.userId,
      entity: ActivityEntity.TASK,
      action: dto.status === "DONE" && existingStatus !== "DONE"
        ? ActivityAction.COMPLETED
        : dto.id
          ? ActivityAction.UPDATED
          : ActivityAction.CREATED,
      entityId: task.id,
      description: dto.id ? `Updated task ${task.title}.` : `Created task ${task.title}.`,
      metadata: {
        status: task.status,
        priority: task.priority,
      },
    });

    return {
      task,
      previousClientId,
    };
  }

  async updateTaskStatus(user: RequestUser, taskId: string, status: TaskStatus) {
    const existingTask = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        ...taskAccessWhere(user),
      },
      select: {
        id: true,
        title: true,
        clientId: true,
        status: true,
      },
    });

    if (!existingTask) {
      throw new ForbiddenException("You can only update tasks in your workspace.");
    }

    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status,
        completedAt: status === "DONE" ? new Date() : null,
      },
    });

    await this.activityLogService.log(this.prisma, {
      actorId: user.userId,
      entity: ActivityEntity.TASK,
      action: status === "DONE" ? ActivityAction.COMPLETED : ActivityAction.STATUS_CHANGED,
      entityId: task.id,
      description: status === "DONE"
        ? `Completed task ${task.title}.`
        : `Updated task ${task.title} to ${status}.`,
    });

    return {
      task,
      previousClientId: existingTask.clientId,
    };
  }

  async deleteTask(user: RequestUser, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        ...taskAccessWhere(user),
      },
      select: {
        id: true,
        title: true,
        clientId: true,
      },
    });

    if (!task) {
      throw new ForbiddenException("You can only delete tasks in your workspace.");
    }

    await this.prisma.task.delete({
      where: { id: taskId },
    });

    await this.activityLogService.log(this.prisma, {
      actorId: user.userId,
      entity: ActivityEntity.TASK,
      action: ActivityAction.UPDATED,
      entityId: task.id,
      description: `Deleted task ${task.title}.`,
    });

    return task;
  }
}
