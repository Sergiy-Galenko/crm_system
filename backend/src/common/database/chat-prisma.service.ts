import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/chat-client";
import { loadWorkspaceEnv } from "@backend/common/env/load-workspace-env";

loadWorkspaceEnv();

type GlobalChatPrisma = typeof globalThis & {
  chatPrismaV2?: ChatPrismaService;
};

const globalForChatPrisma = globalThis as GlobalChatPrisma;

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

function createChatPrismaClient() {
  return new ChatPrismaService();
}

export const chatPrisma = globalForChatPrisma.chatPrismaV2 ?? createChatPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForChatPrisma.chatPrismaV2 = chatPrisma;
}
