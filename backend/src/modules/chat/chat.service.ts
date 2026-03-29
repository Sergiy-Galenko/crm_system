import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import type { RequestUser } from "@backend/common/auth/request-user.interface";
import { PrismaService } from "@backend/common/database/prisma.service";
import { chatUsersWhere } from "@backend/common/scope/crm-scope";
import { CreateConversationDto } from "./dto/create-conversation.dto";
import { SendMessageDto } from "./dto/send-message.dto";

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async createConversation(currentUser: RequestUser, dto: CreateConversationDto) {
    const currentUserRecord = await this.prisma.user.findUnique({
      where: {
        id: currentUser.userId,
      },
      select: {
        createdById: true,
      },
    });

    const requestedParticipantIds = [...new Set(dto.participantIds)];
    const accessibleUsers = await this.prisma.user.findMany({
      where: {
        id: {
          in: requestedParticipantIds,
        },
        ...chatUsersWhere({
          ...currentUser,
          createdById: currentUserRecord?.createdById,
        }),
      },
      select: {
        id: true,
      },
    });

    if (accessibleUsers.length !== requestedParticipantIds.length) {
      throw new BadRequestException("Choose teammates from your workspace.");
    }

    const teammateIds = accessibleUsers.map((user) => user.id).filter((userId) => userId !== currentUser.userId);

    if (!teammateIds.length) {
      throw new BadRequestException("Choose at least one teammate.");
    }

    if (dto.type === "DIRECT") {
      if (teammateIds.length !== 1) {
        throw new BadRequestException("Direct chats require exactly one teammate.");
      }

      const [teammateId] = teammateIds;
      const existingConversation = await this.prisma.chatConversation.findFirst({
        where: {
          type: "DIRECT",
          AND: [
            {
              participants: {
                some: {
                  userId: currentUser.userId,
                },
              },
            },
            {
              participants: {
                some: {
                  userId: teammateId,
                },
              },
            },
            {
              participants: {
                every: {
                  userId: {
                    in: [currentUser.userId, teammateId],
                  },
                },
              },
            },
          ],
        },
        select: {
          id: true,
        },
      });

      if (existingConversation) {
        return existingConversation;
      }
    }

    if (dto.type === "GROUP") {
      if (!dto.title) {
        throw new BadRequestException("Group chats require a name.");
      }

      if (teammateIds.length < 1) {
        throw new BadRequestException("Groups require at least one teammate.");
      }
    }

    const participantIds = [currentUser.userId, ...teammateIds];

    return this.prisma.chatConversation.create({
      data: {
        type: dto.type,
        title: dto.type === "GROUP" ? dto.title ?? null : null,
        createdById: currentUser.userId,
        lastMessageAt: new Date(),
        participants: {
          create: participantIds.map((userId) => ({
            userId,
          })),
        },
      },
      select: {
        id: true,
      },
    });
  }

  async sendMessage(currentUser: RequestUser, dto: SendMessageDto) {
    const participant = await this.prisma.chatParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: dto.conversationId,
          userId: currentUser.userId,
        },
      },
      select: {
        conversationId: true,
      },
    });

    if (!participant) {
      throw new ForbiddenException("This conversation is not available.");
    }

    if (!dto.body && !dto.mediaUrl) {
      throw new BadRequestException("Message cannot be empty.");
    }

    if (dto.mediaUrl && !dto.mediaType) {
      throw new BadRequestException("Choose a valid chat attachment type.");
    }

    const now = new Date();

    const [message] = await this.prisma.$transaction([
      this.prisma.chatMessage.create({
        data: {
          conversationId: dto.conversationId,
          senderId: currentUser.userId,
          body: dto.body ?? null,
          mediaUrl: dto.mediaUrl ?? null,
          mediaType: dto.mediaType ?? null,
        },
      }),
      this.prisma.chatConversation.update({
        where: {
          id: dto.conversationId,
        },
        data: {
          lastMessageAt: now,
        },
      }),
      this.prisma.$executeRaw`
        UPDATE "ChatParticipant"
        SET "lastReadAt" = ${now}
        WHERE "conversationId" = ${dto.conversationId}
          AND "userId" = ${currentUser.userId}
      `,
    ]);

    return message;
  }

  async markConversationRead(currentUser: RequestUser, conversationId: string) {
    const participant = await this.prisma.chatParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: currentUser.userId,
        },
      },
      select: {
        conversationId: true,
      },
    });

    if (!participant) {
      throw new ForbiddenException("This conversation is not available.");
    }

    await this.prisma.$executeRaw`
      UPDATE "ChatParticipant"
      SET "lastReadAt" = ${new Date()}
      WHERE "conversationId" = ${conversationId}
        AND "userId" = ${currentUser.userId}
    `;
  }
}
