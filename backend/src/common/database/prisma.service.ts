import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Prisma, PrismaClient } from "@prisma/client";
import { loadWorkspaceEnv } from "@backend/common/env/load-workspace-env";

loadWorkspaceEnv();

type GlobalPrisma = typeof globalThis & {
  prisma?: PrismaClient;
  prismaSchemaKey?: string;
};

const globalForPrisma = globalThis as GlobalPrisma;

function getPrismaSchemaKey() {
  return JSON.stringify({
    user: Prisma.UserScalarFieldEnum,
    client: Prisma.ClientScalarFieldEnum,
    lead: Prisma.LeadScalarFieldEnum,
    deal: Prisma.DealScalarFieldEnum,
    task: Prisma.TaskScalarFieldEnum,
    meeting: Prisma.MeetingScalarFieldEnum,
    chatConversation: Prisma.ChatConversationScalarFieldEnum,
    chatParticipant: Prisma.ChatParticipantScalarFieldEnum,
    chatMessage: Prisma.ChatMessageScalarFieldEnum,
    promoCode: Prisma.PromoCodeScalarFieldEnum,
    promoCodeUsage: Prisma.PromoCodeUsageScalarFieldEnum,
    activityLog: Prisma.ActivityLogScalarFieldEnum,
  });
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const prismaSchemaKey = getPrismaSchemaKey();
const shouldReusePrisma = globalForPrisma.prisma && globalForPrisma.prismaSchemaKey === prismaSchemaKey;

if (!shouldReusePrisma && globalForPrisma.prisma) {
  void globalForPrisma.prisma.$disconnect().catch(() => undefined);
}

export const prisma = shouldReusePrisma ? globalForPrisma.prisma! : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaSchemaKey = prismaSchemaKey;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
