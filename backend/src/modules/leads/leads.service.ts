import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { ActivityAction, ActivityEntity } from "@prisma/client";
import { ActivityLogService } from "@backend/common/activity/activity-log.service";
import type { RequestUser } from "@backend/common/auth/request-user.interface";
import { PrismaService } from "@backend/common/database/prisma.service";
import { clientAccessWhere, leadAccessWhere, visibleUsersWhere } from "@backend/common/scope/crm-scope";
import { UpsertLeadDto } from "./dto/upsert-lead.dto";

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async upsertLead(user: RequestUser, dto: UpsertLeadDto) {
    const owner = await this.prisma.user.findFirst({
      where: {
        id: dto.ownerId,
        ...visibleUsersWhere(user),
      },
      select: { id: true },
    });

    if (!owner) {
      throw new BadRequestException("That owner is not in your team.");
    }

    if (dto.clientId) {
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
    }

    if (dto.id) {
      const existingLead = await this.prisma.lead.findFirst({
        where: {
          id: dto.id,
          ...leadAccessWhere(user),
        },
        select: { id: true },
      });

      if (!existingLead) {
        throw new ForbiddenException("You can only update leads in your workspace.");
      }
    }

    const lead = dto.id
      ? await this.prisma.lead.update({
          where: { id: dto.id },
          data: {
            name: dto.name,
            company: dto.company,
            email: dto.email.toLowerCase(),
            phone: dto.phone,
            source: dto.source,
            status: dto.status,
            estimatedValue: dto.estimatedValue,
            ownerId: dto.ownerId,
            nextFollowUpAt: dto.nextFollowUpAt,
            clientId: dto.clientId || null,
          },
        })
      : await this.prisma.lead.create({
          data: {
            name: dto.name,
            company: dto.company,
            email: dto.email.toLowerCase(),
            phone: dto.phone,
            source: dto.source,
            status: dto.status,
            estimatedValue: dto.estimatedValue,
            ownerId: dto.ownerId,
            nextFollowUpAt: dto.nextFollowUpAt,
            clientId: dto.clientId || null,
          },
        });

    await this.activityLogService.log(this.prisma, {
      actorId: user.userId,
      entity: ActivityEntity.LEAD,
      action: dto.id ? ActivityAction.UPDATED : ActivityAction.CREATED,
      entityId: lead.id,
      description: dto.id ? `Updated lead ${lead.company}.` : `Added lead ${lead.company}.`,
    });

    return lead;
  }
}
