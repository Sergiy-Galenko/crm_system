import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ActivityAction, ActivityEntity, Prisma } from "@prisma/client";
import { ActivityLogService } from "@backend/common/activity/activity-log.service";
import type { RequestUser } from "@backend/common/auth/request-user.interface";
import { PrismaService } from "@backend/common/database/prisma.service";
import { meetingAccessWhere, taskAccessWhere, visibleUsersWhere } from "@backend/common/scope/crm-scope";
import { UpsertRecordCommentDto } from "./dto/upsert-record-comment.dto";

const recordCommentAuthorSelect = {
  id: true,
  name: true,
  email: true,
  nickname: true,
  avatarColor: true,
  companyLogoUrl: true,
} satisfies Prisma.UserSelect;

const recordCommentInclude = {
  author: {
    select: recordCommentAuthorSelect,
  },
} satisfies Prisma.RecordCommentInclude;

function extractMentionNicknames(body: string) {
  return [...new Set(Array.from(body.matchAll(/(^|\s)@([a-z0-9_]{3,24})\b/g), (match) => match[2] ?? "").filter(Boolean))];
}

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  private async resolveMentionUserIds(user: RequestUser, body: string) {
    const nicknames = extractMentionNicknames(body);

    if (!nicknames.length) {
      return [];
    }

    const users = await this.prisma.user.findMany({
      where: {
        nickname: {
          in: nicknames,
        },
        ...visibleUsersWhere(user),
      },
      select: {
        id: true,
      },
    });

    return users.map((visibleUser) => visibleUser.id);
  }

  private async ensureTaskAccess(user: RequestUser, taskId: string) {
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
      throw new ForbiddenException("You can only comment on tasks in your workspace.");
    }

    return task;
  }

  private async ensureMeetingAccess(user: RequestUser, meetingId: string) {
    const meeting = await this.prisma.meeting.findFirst({
      where: {
        id: meetingId,
        ...meetingAccessWhere(user),
      },
      select: {
        id: true,
        title: true,
        clientId: true,
      },
    });

    if (!meeting) {
      throw new ForbiddenException("You can only comment on meetings in your workspace.");
    }

    return meeting;
  }

  async upsertComment(user: RequestUser, dto: UpsertRecordCommentDto) {
    const body = dto.body.trim();

    if (!body) {
      throw new BadRequestException("Comment cannot be empty.");
    }

    const hasTask = Boolean(dto.taskId);
    const hasMeeting = Boolean(dto.meetingId);

    if (hasTask === hasMeeting) {
      throw new BadRequestException("Choose a task or meeting to comment on.");
    }

    const mentionUserIds = await this.resolveMentionUserIds(user, body);

    if (dto.id) {
      const existingComment = await this.prisma.recordComment.findFirst({
        where: {
          id: dto.id,
          OR: [
            dto.taskId
              ? {
                  task: {
                    id: dto.taskId,
                    ...taskAccessWhere(user),
                  },
                }
              : undefined,
            dto.meetingId
              ? {
                  meeting: {
                    id: dto.meetingId,
                    ...meetingAccessWhere(user),
                  },
                }
              : undefined,
          ].filter(Boolean) as Prisma.RecordCommentWhereInput[],
        },
        select: {
          id: true,
          authorId: true,
          task: {
            select: {
              clientId: true,
            },
          },
          meeting: {
            select: {
              clientId: true,
            },
          },
        },
      });

      if (!existingComment) {
        throw new NotFoundException("Comment not found.");
      }

      if (existingComment.authorId !== user.userId) {
        throw new ForbiddenException("You can only edit your own comments.");
      }

      const comment = await this.prisma.recordComment.update({
        where: {
          id: dto.id,
        },
        data: {
          body,
          editedAt: new Date(),
          mentionUserIds,
        },
        include: recordCommentInclude,
      });

      return {
        comment,
        clientId: existingComment.task?.clientId ?? existingComment.meeting?.clientId ?? null,
      };
    }

    if (dto.taskId) {
      const task = await this.ensureTaskAccess(user, dto.taskId);
      const comment = await this.prisma.recordComment.create({
        data: {
          body,
          mentionUserIds,
          authorId: user.userId,
          taskId: dto.taskId,
        },
        include: recordCommentInclude,
      });

      await this.activityLogService.log(this.prisma, {
        actorId: user.userId,
        entity: ActivityEntity.TASK,
        action: ActivityAction.UPDATED,
        entityId: task.id,
        description: `Commented on task ${task.title}.`,
      });

      return {
        comment,
        clientId: task.clientId,
      };
    }

    const meeting = await this.ensureMeetingAccess(user, dto.meetingId!);
    const comment = await this.prisma.recordComment.create({
      data: {
        body,
        mentionUserIds,
        authorId: user.userId,
        meetingId: dto.meetingId!,
      },
      include: recordCommentInclude,
    });

    await this.activityLogService.log(this.prisma, {
      actorId: user.userId,
      entity: ActivityEntity.MEETING,
      action: ActivityAction.UPDATED,
      entityId: meeting.id,
      description: `Commented on meeting ${meeting.title}.`,
    });

    return {
      comment,
      clientId: meeting.clientId,
    };
  }
}
