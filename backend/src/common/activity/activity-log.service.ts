import { Injectable } from "@nestjs/common";
import { type ActivityAction, type ActivityEntity, Prisma } from "@prisma/client";
import { PrismaService, prisma } from "@backend/common/database/prisma.service";

type ActivityClient = PrismaService | Prisma.TransactionClient | typeof prisma;

type LogActivityInput = {
  actorId?: string | null;
  entity: ActivityEntity;
  action: ActivityAction;
  entityId?: string | null;
  description: string;
  metadata?: Prisma.InputJsonValue;
};

@Injectable()
export class ActivityLogService {
  async log(client: ActivityClient, input: LogActivityInput) {
    return client.activityLog.create({
      data: {
        actorId: input.actorId ?? null,
        entity: input.entity,
        action: input.action,
        entityId: input.entityId ?? null,
        description: input.description,
        metadata: input.metadata,
      },
    });
  }
}
