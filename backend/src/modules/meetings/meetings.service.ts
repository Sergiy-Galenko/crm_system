import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { ActivityAction, ActivityEntity, MeetingStatus } from "@prisma/client";
import { ActivityLogService } from "@backend/common/activity/activity-log.service";
import type { RequestUser } from "@backend/common/auth/request-user.interface";
import { PrismaService } from "@backend/common/database/prisma.service";
import { clientAccessWhere, meetingAccessWhere, visibleUsersWhere } from "@backend/common/scope/crm-scope";
import { UpsertMeetingDto } from "./dto/upsert-meeting.dto";

@Injectable()
export class MeetingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async upsertMeeting(user: RequestUser, dto: UpsertMeetingDto) {
    const assignee = await this.prisma.user.findFirst({
      where: {
        id: dto.assignedToId,
        ...visibleUsersWhere(user),
      },
      select: { id: true },
    });

    if (!assignee) {
      throw new BadRequestException("That assignee is not in your team.");
    }

    const client = await this.prisma.client.findFirst({
      where: {
        id: dto.clientId,
        ...clientAccessWhere(user),
      },
      select: { id: true },
    });

    if (!client) {
      throw new BadRequestException("That client is not available in your workspace.");
    }

    let previousClientId: string | null = null;

    if (dto.id) {
      const existingMeeting = await this.prisma.meeting.findFirst({
        where: {
          id: dto.id,
          ...meetingAccessWhere(user),
        },
        select: {
          id: true,
          clientId: true,
        },
      });

      if (!existingMeeting) {
        throw new ForbiddenException("You can only update meetings in your workspace.");
      }

      previousClientId = existingMeeting.clientId;
    }

    const meeting = dto.id
      ? await this.prisma.meeting.update({
          where: { id: dto.id },
          data: {
            title: dto.title,
            description: dto.description || null,
            status: dto.status,
            startsAt: dto.startsAt,
            endsAt: dto.endsAt,
            location: dto.location || null,
            meetingLink: dto.meetingLink || null,
            outcome: dto.outcome || null,
            clientId: dto.clientId,
            assignedToId: dto.assignedToId,
          },
        })
      : await this.prisma.meeting.create({
          data: {
            title: dto.title,
            description: dto.description || null,
            status: dto.status,
            startsAt: dto.startsAt,
            endsAt: dto.endsAt,
            location: dto.location || null,
            meetingLink: dto.meetingLink || null,
            outcome: dto.outcome || null,
            clientId: dto.clientId,
            assignedToId: dto.assignedToId,
            createdById: user.userId,
          },
        });

    await this.activityLogService.log(this.prisma, {
      actorId: user.userId,
      entity: ActivityEntity.MEETING,
      action: dto.id ? ActivityAction.UPDATED : ActivityAction.CREATED,
      entityId: meeting.id,
      description: dto.id ? `Updated meeting ${meeting.title}.` : `Scheduled meeting ${meeting.title}.`,
    });

    return {
      meeting,
      previousClientId,
    };
  }

  async updateMeetingStatus(user: RequestUser, meetingId: string, status: MeetingStatus) {
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
      throw new ForbiddenException("You can only update meetings in your workspace.");
    }

    await this.prisma.meeting.update({
      where: { id: meetingId },
      data: {
        status,
      },
    });

    await this.activityLogService.log(this.prisma, {
      actorId: user.userId,
      entity: ActivityEntity.MEETING,
      action: status === "COMPLETED" ? ActivityAction.COMPLETED : ActivityAction.STATUS_CHANGED,
      entityId: meeting.id,
      description: status === "COMPLETED" ? `Marked meeting ${meeting.title} as completed.` : `Updated meeting ${meeting.title} to ${status}.`,
    });

    return meeting;
  }

  async deleteMeeting(user: RequestUser, meetingId: string) {
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
      throw new ForbiddenException("You can only delete meetings in your workspace.");
    }

    await this.prisma.meeting.delete({
      where: { id: meetingId },
    });

    await this.activityLogService.log(this.prisma, {
      actorId: user.userId,
      entity: ActivityEntity.MEETING,
      action: ActivityAction.UPDATED,
      entityId: meeting.id,
      description: `Deleted meeting ${meeting.title}.`,
    });

    return meeting;
  }
}
