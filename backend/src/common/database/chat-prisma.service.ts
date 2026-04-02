import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/chat-client";
import { loadWorkspaceEnv } from "@backend/common/env/load-workspace-env";

loadWorkspaceEnv();

type GlobalChatPrisma = typeof globalThis & {
  chatPrismaV2?: PrismaClient;
};

const globalForChatPrisma = globalThis as GlobalChatPrisma;

function createChatPrismaClient() {
  return new PrismaClient({
    datasourceUrl: process.env.CHAT_DATABASE_URL,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const chatPrisma = globalForChatPrisma.chatPrismaV2 ?? createChatPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForChatPrisma.chatPrismaV2 = chatPrisma;
}

@Injectable()
export class ChatPrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      datasourceUrl: process.env.CHAT_DATABASE_URL,
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
