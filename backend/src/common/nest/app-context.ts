import "reflect-metadata";

import type { Type } from "@nestjs/common";
import { ActivityLogService } from "@backend/common/activity/activity-log.service";
import { PrismaService } from "@backend/common/database/prisma.service";
import { ChatPrismaService } from "@backend/common/database/chat-prisma.service";
import { AuthService } from "@backend/modules/auth/auth.service";
import { ChatService } from "@backend/modules/chat/chat.service";
import { CommentsService } from "@backend/modules/comments/comments.service";
import { ClientsService } from "@backend/modules/clients/clients.service";
import { DealsService } from "@backend/modules/deals/deals.service";
import { LeadsService } from "@backend/modules/leads/leads.service";
import { MeetingsService } from "@backend/modules/meetings/meetings.service";
import { PromoCodesService } from "@backend/modules/promo-codes/promo-codes.service";
import { UsersService } from "@backend/modules/users/users.service";

type BackendProviders = {
  prismaService: PrismaService;
  chatPrismaService: ChatPrismaService;
  activityLogService: ActivityLogService;
  authService: AuthService;
  chatService: ChatService;
  commentsService: CommentsService;
  clientsService: ClientsService;
  leadsService: LeadsService;
  promoCodesService: PromoCodesService;
  dealsService: DealsService;
  meetingsService: MeetingsService;
  usersService: UsersService;
};

type GlobalBackendProviders = typeof globalThis & {
  backendProviders?: Promise<BackendProviders>;
};

const globalForBackendProviders = globalThis as GlobalBackendProviders;

async function createProviders(): Promise<BackendProviders> {
  const prismaService = new PrismaService();
  const chatPrismaService = new ChatPrismaService();
  const activityLogService = new ActivityLogService();
  const authService = new AuthService(prismaService, activityLogService);
  const chatService = new ChatService(prismaService, chatPrismaService);
  const commentsService = new CommentsService(prismaService, activityLogService);
  const clientsService = new ClientsService(prismaService, activityLogService);
  const leadsService = new LeadsService(prismaService, activityLogService);
  const promoCodesService = new PromoCodesService(prismaService, activityLogService);
  const dealsService = new DealsService(prismaService, activityLogService, promoCodesService);
  const meetingsService = new MeetingsService(prismaService, activityLogService);
  const usersService = new UsersService(prismaService, activityLogService);

  return {
    prismaService,
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
    [UsersService, providers.usersService],
  ]);

  const instance = providerMap.get(provider);

  if (!instance) {
    throw new Error(`Unsupported provider: ${provider.name}`);
  }

  return instance as T;
}
