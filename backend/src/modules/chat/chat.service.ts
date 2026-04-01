import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { ChatMessageStatus } from "@prisma/client";
import type { RequestUser } from "@backend/common/auth/request-user.interface";
import { PrismaService } from "@backend/common/database/prisma.service";
import { chatUsersWhere } from "@backend/common/scope/crm-scope";
import { CreateConversationDto } from "./dto/create-conversation.dto";
import { SendMessageDto } from "./dto/send-message.dto";
import { UpdateMessageDto } from "./dto/update-message.dto";

const allowedChatReactions = new Set(["👍", "❤️", "🔥", "😂", "👏", "🎯"]);

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureParticipant(currentUser: RequestUser, conversationId: string) {
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

    return participant;
  }

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
    const participant = await this.ensureParticipant(currentUser, dto.conversationId);

    if (!dto.body && !dto.mediaUrl) {
      throw new BadRequestException("Message cannot be empty.");
    }

    if (dto.mediaUrl && !dto.mediaType) {
      throw new BadRequestException("Choose a valid chat attachment type.");
    }

    if (dto.replyToMessageId) {
      const replyTarget = await this.prisma.chatMessage.findFirst({
        where: {
          id: dto.replyToMessageId,
          conversationId: dto.conversationId,
        },
        select: {
          id: true,
        },
      });

      if (!replyTarget) {
        throw new BadRequestException("Choose a message from this conversation.");
      }
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
          replyToMessageId: dto.replyToMessageId ?? null,
          status: ChatMessageStatus.SENT,
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

  async updateMessage(currentUser: RequestUser, messageId: string, dto: UpdateMessageDto) {
    const message = await this.prisma.chatMessage.findFirst({
      where: {
        id: messageId,
        conversation: {
          participants: {
            some: {
              userId: currentUser.userId,
            },
          },
        },
      },
      select: {
        id: true,
        senderId: true,
        conversationId: true,
      },
    });

    if (!message) {
      throw new ForbiddenException("This conversation is not available.");
    }

    if (message.senderId !== currentUser.userId) {
      throw new ForbiddenException("You can only edit your own messages.");
    }

    return this.prisma.chatMessage.update({
      where: {
        id: messageId,
      },
      data: {
        body: dto.body,
        editedAt: new Date(),
      },
      select: {
        id: true,
        conversationId: true,
      },
    });
  }

  async markConversationRead(currentUser: RequestUser, conversationId: string) {
    await this.ensureParticipant(currentUser, conversationId);

    await this.prisma.$transaction([
      this.prisma.$executeRaw`
        UPDATE "ChatParticipant"
        SET "lastReadAt" = ${new Date()}
        WHERE "conversationId" = ${conversationId}
          AND "userId" = ${currentUser.userId}
      `,
      this.prisma.chatMessage.updateMany({
        where: {
          conversationId,
          senderId: {
            not: currentUser.userId,
          },
          status: {
            not: ChatMessageStatus.READ,
          },
        },
        data: {
          status: ChatMessageStatus.READ,
        },
      }),
    ]);
  }

  async toggleMessageReaction(currentUser: RequestUser, messageId: string, emoji: string) {
    if (!allowedChatReactions.has(emoji)) {
      throw new BadRequestException("Choose a valid reaction.");
    }

    const message = await this.prisma.chatMessage.findFirst({
      where: {
        id: messageId,
        conversation: {
          participants: {
            some: {
              userId: currentUser.userId,
            },
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (!message) {
      throw new ForbiddenException("This conversation is not available.");
    }

    const existingReaction = (
      await this.prisma.$queryRaw<Array<{ id: string; emoji: string }>>`
        SELECT "id", "emoji"
        FROM "ChatMessageReaction"
        WHERE "messageId" = ${messageId}
          AND "userId" = ${currentUser.userId}
        LIMIT 1
      `
    )[0];

    if (existingReaction?.emoji === emoji) {
      await this.prisma.$executeRaw`
        DELETE FROM "ChatMessageReaction"
        WHERE "messageId" = ${messageId}
          AND "userId" = ${currentUser.userId}
      `;

      return;
    }

    if (existingReaction) {
      await this.prisma.$executeRaw`
        UPDATE "ChatMessageReaction"
        SET "emoji" = ${emoji}
        WHERE "id" = ${existingReaction.id}
      `;

      return;
    }

    await this.prisma.$executeRaw`
      INSERT INTO "ChatMessageReaction" ("id", "messageId", "userId", "emoji", "createdAt")
      VALUES (${randomUUID()}, ${messageId}, ${currentUser.userId}, ${emoji}, NOW())
    `;
  }
}
