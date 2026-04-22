import "reflect-metadata";

import type { Type } from "@nestjs/common";
import { ActivityLogService } from "@backend/common/activity/activity-log.service";
import { AuthPrismaService, authPrisma } from "@backend/common/database/auth-prisma.service";
import { PrismaService, prisma } from "@backend/common/database/prisma.service";
import { ChatPrismaService, chatPrisma } from "@backend/common/database/chat-prisma.service";
import { AuthService } from "@backend/modules/auth/auth.service";
import { ChatService } from "@backend/modules/chat/chat.service";
import { CommentsService } from "@backend/modules/comments/comments.service";
import { ClientsService } from "@backend/modules/clients/clients.service";
import { DealsService } from "@backend/modules/deals/deals.service";
import { LeadsService } from "@backend/modules/leads/leads.service";
import { MeetingsService } from "@backend/modules/meetings/meetings.service";
import { PromoCodesService } from "@backend/modules/promo-codes/promo-codes.service";
import { TasksService } from "@backend/modules/tasks/tasks.service";
import { UsersService } from "@backend/modules/users/users.service";

type BackendProviders = {
  prismaService: typeof prisma;
  authPrismaService: typeof authPrisma;
  chatPrismaService: typeof chatPrisma;
  activityLogService: ActivityLogService;
  authService: AuthService;
  chatService: ChatService;
  commentsService: CommentsService;
  clientsService: ClientsService;
  leadsService: LeadsService;
  promoCodesService: PromoCodesService;
  dealsService: DealsService;
  meetingsService: MeetingsService;
  tasksService: TasksService;
  usersService: UsersService;
};

type GlobalBackendProviders = typeof globalThis & {
  backendProviders?: Promise<BackendProviders>;
};

const globalForBackendProviders = globalThis as GlobalBackendProviders;

async function createProviders(): Promise<BackendProviders> {
  // Reuse module-level Prisma singletons to avoid duplicate connection pools.
  // Each *-prisma.service.ts already creates a global singleton that survives
  // HMR in development — creating new instances here would waste connections.
  const prismaService = prisma;
  const authPrismaService = authPrisma;
  const chatPrismaService = chatPrisma;
  const activityLogService = new ActivityLogService();

  const authService = new AuthService(prismaService as PrismaService, authPrismaService as AuthPrismaService, activityLogService);
  const chatService = new ChatService(prismaService as PrismaService, chatPrismaService as ChatPrismaService);
  const commentsService = new CommentsService(prismaService as PrismaService, activityLogService);
  const clientsService = new ClientsService(prismaService as PrismaService, activityLogService);
  const leadsService = new LeadsService(prismaService as PrismaService, activityLogService);
  const promoCodesService = new PromoCodesService(prismaService as PrismaService, activityLogService);
  const dealsService = new DealsService(prismaService as PrismaService, activityLogService, promoCodesService);
  const meetingsService = new MeetingsService(prismaService as PrismaService, activityLogService);
  const tasksService = new TasksService(prismaService as PrismaService, activityLogService);
  const usersService = new UsersService(prismaService as PrismaService, authPrismaService as AuthPrismaService, activityLogService);

  return {
    prismaService,
    authPrismaService,
    chatPrismaService,
    activityLogService,
    authService,
    chatService,
    commentsService,
    clientsService,
    leadsService,
    promoCodesService,
    dealsService,
    meetingsService,
    tasksService,
    usersService,
  };
}

export async function getBackendProviders() {
  if (!globalForBackendProviders.backendProviders) {
    globalForBackendProviders.backendProviders = createProviders();
  }

  return globalForBackendProviders.backendProviders;
}

export async function resolveProvider<T>(provider: Type<T> | symbol | string) {
  if (typeof provider !== "function") {
    throw new Error("Only class providers can be resolved from the frontend adapter.");
  }

  const providers = await getBackendProviders();

  const providerMap = new Map<Function, unknown>([
    [PrismaService, providers.prismaService],
    [AuthPrismaService, providers.authPrismaService],
    [ChatPrismaService, providers.chatPrismaService],
    [ActivityLogService, providers.activityLogService],
    [AuthService, providers.authService],
    [ChatService, providers.chatService],
    [CommentsService, providers.commentsService],
    [ClientsService, providers.clientsService],
    [LeadsService, providers.leadsService],
    [PromoCodesService, providers.promoCodesService],
    [DealsService, providers.dealsService],
    [MeetingsService, providers.meetingsService],
    [TasksService, providers.tasksService],
    [UsersService, providers.usersService],
  ]);

  const instance = providerMap.get(provider);

  if (!instance) {
    throw new Error(`Unsupported provider: ${provider.name}`);
  }

  return instance as T;
}
