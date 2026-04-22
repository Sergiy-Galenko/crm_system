import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ActivityAction, ActivityEntity } from "@prisma/client";
import { ActivityLogService } from "@backend/common/activity/activity-log.service";
import { PrismaService } from "@backend/common/database/prisma.service";
import { clientAccessWhere, dealAccessWhere, leadAccessWhere, visibleUsersWhere } from "@backend/common/scope/crm-scope";
import type { RequestUser } from "@backend/common/auth/request-user.interface";
import { CreateNoteDto } from "./dto/create-note.dto";
import { UpsertClientDto } from "./dto/upsert-client.dto";

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async upsertClient(user: RequestUser, dto: UpsertClientDto) {
    const [owner, existingClient] = await Promise.all([
      this.prisma.user.findFirst({
        where: {
          id: dto.ownerId,
          ...visibleUsersWhere(user),
        },
        select: {
          id: true,
        },
      }),
      dto.id
        ? this.prisma.client.findFirst({
            where: {
              id: dto.id,
              ...clientAccessWhere(user),
            },
            select: {
              id: true,
            },
          })
        : Promise.resolve(null),
    ]);

    if (!owner) {
      throw new BadRequestException("That owner is not in your team.");
    }

    if (dto.id) {
      if (!existingClient) {
        throw new ForbiddenException("You can only update clients in your workspace.");
      }
    }

    try {
      const client = dto.id
        ? await this.prisma.client.update({
            where: { id: dto.id },
            data: {
              name: dto.name,
              company: dto.company,
              email: dto.email.toLowerCase(),
              phone: dto.phone,
              status: dto.status,
              segment: dto.segment || null,
              location: dto.location || null,
              monthlyValue: dto.monthlyValue,
              ownerId: dto.ownerId,
            },
          })
        : await this.prisma.client.create({
            data: {
              name: dto.name,
              company: dto.company,
              email: dto.email.toLowerCase(),
              phone: dto.phone,
              status: dto.status,
              segment: dto.segment || null,
              location: dto.location || null,
              monthlyValue: dto.monthlyValue,
              ownerId: dto.ownerId,
              lastContactAt: new Date(),
            },
          });

      await this.activityLogService.log(this.prisma, {
        actorId: user.userId,
        entity: ActivityEntity.CLIENT,
        action: dto.id ? ActivityAction.UPDATED : ActivityAction.CREATED,
        entityId: client.id,
        description: dto.id ? `Updated client ${client.company}.` : `Added client ${client.company}.`,
      });

      return client;
    } catch (error) {
      if (error instanceof Error && error.message.includes("Unique constraint")) {
        throw new ConflictException("That email is already attached to another client.");
      }

      throw error;
    }
  }

  async createNote(user: RequestUser, dto: CreateNoteDto) {
    const [client, lead, deal] = await Promise.all([
      dto.clientId
        ? this.prisma.client.findFirst({
            where: {
              id: dto.clientId,
              ...clientAccessWhere(user),
            },
            select: { id: true },
          })
        : Promise.resolve(null),
      dto.leadId
        ? this.prisma.lead.findFirst({
            where: {
              id: dto.leadId,
              ...leadAccessWhere(user),
            },
            select: { id: true },
          })
        : Promise.resolve(null),
      dto.dealId
        ? this.prisma.deal.findFirst({
            where: {
              id: dto.dealId,
              ...dealAccessWhere(user),
            },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    if (dto.clientId && !client) {
      throw new ForbiddenException("You can only add notes to records in your workspace.");
    }

    if (dto.leadId && !lead) {
      throw new ForbiddenException("You can only add notes to records in your workspace.");
    }

    if (dto.dealId && !deal) {
      throw new ForbiddenException("You can only add notes to records in your workspace.");
    }

    const note = await this.prisma.note.create({
      data: {
        body: dto.body,
        authorId: user.userId,
        clientId: dto.clientId || null,
        leadId: dto.leadId || null,
        dealId: dto.dealId || null,
      },
    });

    await this.activityLogService.log(this.prisma, {
      actorId: user.userId,
      entity: ActivityEntity.NOTE,
      action: ActivityAction.CREATED,
      entityId: note.id,
      description: "Added a new note to the CRM timeline.",
    });

    return note;
  }
}
