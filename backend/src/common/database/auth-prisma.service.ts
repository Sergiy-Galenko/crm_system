import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/auth-client";
import { loadWorkspaceEnv } from "@backend/common/env/load-workspace-env";

loadWorkspaceEnv();

type GlobalAuthPrisma = typeof globalThis & {
  authPrismaV1?: PrismaClient;
};

const globalForAuthPrisma = globalThis as GlobalAuthPrisma;

function createAuthPrismaClient() {
  return new PrismaClient({
    datasourceUrl: process.env.AUTH_DATABASE_URL,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const authPrisma = globalForAuthPrisma.authPrismaV1 ?? createAuthPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForAuthPrisma.authPrismaV1 = authPrisma;
}

@Injectable()
export class AuthPrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      datasourceUrl: process.env.AUTH_DATABASE_URL,
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
