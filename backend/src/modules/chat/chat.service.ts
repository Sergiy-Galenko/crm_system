import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { ChatMessageStatus } from "@prisma/chat-client";
import type { RequestUser } from "@backend/common/auth/request-user.interface";
import { PrismaService } from "@backend/common/database/prisma.service";
import { ChatPrismaService } from "@backend/common/database/chat-prisma.service";
import { chatUsersWhere } from "@backend/common/scope/crm-scope";
import { CreateConversationDto } from "./dto/create-conversation.dto";
import { SendMessageDto } from "./dto/send-message.dto";
import { UpdateMessageDto } from "./dto/update-message.dto";

const allowedChatReactions = new Set(["👍", "❤️", "🔥", "😂", "👏", "🎯"]);

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatPrisma: ChatPrismaService,
  ) {}

  private async ensureParticipant(currentUser: RequestUser, conversationId: string) {
    const participant = await this.chatPrisma.chatParticipant.findUnique({
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
      const existingConversation = await this.chatPrisma.chatConversation.findFirst({
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

    return this.chatPrisma.chatConversation.create({
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

    if (!dto.body && !dto.mediaUrl && !dto.poll) {
      throw new BadRequestException("Message cannot be empty.");
    }

    if (dto.mediaUrl && !dto.mediaType) {
      throw new BadRequestException("Choose a valid chat attachment type.");
    }

    if (dto.replyToMessageId) {
      const replyTarget = await this.chatPrisma.chatMessage.findFirst({
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

    const [message] = await this.chatPrisma.$transaction([
      this.chatPrisma.chatMessage.create({
        data: {
          conversationId: dto.conversationId,
          senderId: currentUser.userId,
          body: dto.body ?? null,
          mediaUrl: dto.mediaUrl ?? null,
          mediaType: dto.mediaType ?? null,
          replyToMessageId: dto.replyToMessageId ?? null,
          status: ChatMessageStatus.SENT,
          poll: dto.poll
            ? {
                create: {
                  question: dto.poll.question,
                  options: {
                    create: dto.poll.options.map((opt) => ({ text: opt })),
                  },
                },
              }
            : undefined,
        },
      }),
      this.chatPrisma.chatConversation.update({
        where: {
          id: dto.conversationId,
        },
        data: {
          lastMessageAt: now,
        },
      }),
      this.chatPrisma.$executeRaw`
        UPDATE "ChatParticipant"
        SET "lastReadAt" = ${now}
        WHERE "conversationId" = ${dto.conversationId}
          AND "userId" = ${currentUser.userId}
      `,
    ]);

    return message;
  }

  async updateMessage(currentUser: RequestUser, messageId: string, dto: UpdateMessageDto) {
    const message = await this.chatPrisma.chatMessage.findFirst({
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

    return this.chatPrisma.chatMessage.update({
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

  async deleteMessage(currentUser: RequestUser, messageId: string) {
    const message = await this.chatPrisma.chatMessage.findFirst({
      where: {
        id: messageId,
        senderId: currentUser.userId,
      },
      select: {
        id: true,
      },
    });

    if (!message) {
      throw new ForbiddenException("You can only delete your own messages or the message does not exist.");
    }

    await this.chatPrisma.chatMessage.delete({
      where: {
        id: messageId,
      },
    });
  }

  async markConversationRead(currentUser: RequestUser, conversationId: string) {
    await this.ensureParticipant(currentUser, conversationId);

    await this.chatPrisma.$transaction([
      this.chatPrisma.$executeRaw`
        UPDATE "ChatParticipant"
        SET "lastReadAt" = ${new Date()}
        WHERE "conversationId" = ${conversationId}
          AND "userId" = ${currentUser.userId}
      `,
      this.chatPrisma.chatMessage.updateMany({
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

    const message = await this.chatPrisma.chatMessage.findFirst({
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
      await this.chatPrisma.$queryRaw<Array<{ id: string; emoji: string }>>`
        SELECT "id", "emoji"
        FROM "ChatMessageReaction"
        WHERE "messageId" = ${messageId}
          AND "userId" = ${currentUser.userId}
        LIMIT 1
      `
    )[0];

    if (existingReaction?.emoji === emoji) {
      await this.chatPrisma.$executeRaw`
        DELETE FROM "ChatMessageReaction"
        WHERE "messageId" = ${messageId}
          AND "userId" = ${currentUser.userId}
      `;

      return;
    }

    if (existingReaction) {
      await this.chatPrisma.$executeRaw`
        UPDATE "ChatMessageReaction"
        SET "emoji" = ${emoji}
        WHERE "id" = ${existingReaction.id}
      `;

      return;
    }

    await this.chatPrisma.$executeRaw`
      INSERT INTO "ChatMessageReaction" ("id", "messageId", "userId", "emoji", "createdAt")
      VALUES (${randomUUID()}, ${messageId}, ${currentUser.userId}, ${emoji}, NOW())
    `;
  }

  async setMute(currentUser: RequestUser, conversationId: string, mutedUntil: Date | null) {
    await this.ensureParticipant(currentUser, conversationId);

    await this.chatPrisma.chatParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId: currentUser.userId,
        },
      },
      data: {
        mutedUntil,
      },
    });
  }

  async pinMessage(currentUser: RequestUser, conversationId: string, messageId: string | null) {
    await this.ensureParticipant(currentUser, conversationId);

    if (messageId) {
      const message = await this.chatPrisma.chatMessage.findFirst({
        where: { id: messageId, conversationId },
        select: { id: true },
      });
      if (!message) {
        throw new BadRequestException("Message not found within this conversation.");
      }
    }

    await this.chatPrisma.chatConversation.update({
      where: { id: conversationId },
      data: { pinnedMessageId: messageId },
    });
  }

  async forwardMessage(currentUser: RequestUser, targetConversationId: string, messageId: string) {
    await this.ensureParticipant(currentUser, targetConversationId);

    const targetMessage = await this.chatPrisma.chatMessage.findFirst({
      where: {
        id: messageId,
        conversation: {
          participants: { some: { userId: currentUser.userId } }
        }
      },
    });

    if (!targetMessage) {
      throw new ForbiddenException("Cannot forward a message from an inaccessible conversation.");
    }

    if (!targetMessage.body && !targetMessage.mediaUrl) {
      throw new BadRequestException("Message has no content to forward.");
    }

    return this.chatPrisma.chatMessage.create({
      data: {
        conversationId: targetConversationId,
        senderId: currentUser.userId,
        body: targetMessage.body,
        mediaUrl: targetMessage.mediaUrl,
        mediaType: targetMessage.mediaType,
        isForwarded: true,
        status: ChatMessageStatus.SENT,
      },
    });
  }

  async voteOnPoll(currentUser: RequestUser, pollId: string, optionId: string) {
    const poll = await this.chatPrisma.chatPoll.findUnique({
      where: { id: pollId },
      select: {
        message: {
          select: {
            conversationId: true,
          },
        },
      },
    });

    if (!poll) throw new BadRequestException("Poll not found.");
    await this.ensureParticipant(currentUser, poll.message.conversationId);

    const existingVote = await this.chatPrisma.chatPollVote.findUnique({
      where: {
        userId_pollId: {
          userId: currentUser.userId,
          pollId,
        },
      },
    });

    if (existingVote) {
      if (existingVote.optionId === optionId) {
        await this.chatPrisma.chatPollVote.delete({
          where: { id: existingVote.id },
        });
        return;
      } else {
        await this.chatPrisma.chatPollVote.update({
          where: { id: existingVote.id },
          data: { optionId },
        });
        return;
      }
    }

    await this.chatPrisma.chatPollVote.create({
      data: {
        userId: currentUser.userId,
        pollId,
        optionId,
      },
    });
  }
}
