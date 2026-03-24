import "server-only";

import { ActivityAction, ActivityEntity, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

type ActivityClient = typeof prisma | Prisma.TransactionClient;

type LogActivityInput = {
  actorId?: string | null;
  entity: ActivityEntity;
  action: ActivityAction;
  entityId?: string | null;
  description: string;
  metadata?: Prisma.InputJsonValue;
};

export async function logActivity(client: ActivityClient, input: LogActivityInput) {
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
