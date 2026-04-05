import { Prisma } from "@prisma/client";
import { Prisma as ChatPrisma } from "@prisma/chat-client";
import { isToday, isYesterday } from "date-fns";
import { prisma } from "@/lib/db";
import { chatDb } from "@/lib/chat-db";
import { getParam, createPageHref, type SearchParamsRecord } from "@/lib/query-params";
import { formatDate, formatMonthDay, fromNow } from "@/lib/utils";
import { ChatWorkspace } from "@/components/chat/chat-workspace";
import type { ActiveConversation, ChatBackgroundPreference, ChatConversationListItem, ChatMessageItem, ChatUser } from "@/components/chat/chat-types";
import { getServerTranslator } from "@/lib/locale-server";
import type { Locale } from "@/lib/locale";
import { requireUser } from "@/lib/session";
import { chatUsersWhere } from "@/lib/crm-scope";

const chatUserSelect = {
  id: true,
  name: true,
  email: true,
  nickname: true,
  title: true,
  roleLabel: true,
  avatarColor: true,
  companyLogoUrl: true,
  lastSeenAt: true,
} satisfies Prisma.UserSelect;

const conversationListInclude = {
  participants: {
    orderBy: {
      joinedAt: "asc",
    },
  },
  messages: {
    take: 1,
    orderBy: {
      createdAt: "desc",
    },
  },
} satisfies ChatPrisma.ChatConversationInclude;

const conversationDetailInclude = {
  participants: {
    orderBy: {
      joinedAt: "asc",
    },
  },
  messages: {
    orderBy: {
      createdAt: "asc",
    },
    include: {
      replyToMessage: true,
      reactions: true,
      poll: {
        include: {
          options: {
            include: {
              votes: true,
            },
          },
        },
      },
    },
  },
  pinnedMessage: true,
} satisfies ChatPrisma.ChatConversationInclude;

type ConversationListItemRaw = ChatPrisma.ChatConversationGetPayload<{ include: typeof conversationListInclude }>;
type ConversationDetailRaw = ChatPrisma.ChatConversationGetPayload<{ include: typeof conversationDetailInclude }>;
type ChatDirectoryUser = Prisma.UserGetPayload<{ select: typeof chatUserSelect }>;

type EnrichedUser = { user: ChatDirectoryUser };
type EnrichedMessage = { sender: ChatDirectoryUser };
type EnrichedReply = { sender: ChatDirectoryUser };

type ConversationListItem = Omit<ConversationListItemRaw, "participants" | "messages"> & {
  participants: Array<ConversationListItemRaw["participants"][number] & EnrichedUser>;
  messages: Array<ConversationListItemRaw["messages"][number] & EnrichedMessage>;
};

type ConversationDetail = Omit<ConversationDetailRaw, "participants" | "messages" | "pinnedMessage"> & {
  participants: Array<ConversationDetailRaw["participants"][number] & EnrichedUser>;
  messages: Array<
    Omit<ConversationDetailRaw["messages"][number], "replyToMessage"> & EnrichedMessage & {
      replyToMessage: (ConversationDetailRaw["messages"][number]["replyToMessage"] & EnrichedReply) | null;
    }
  >;
  pinnedMessage: (NonNullable<ConversationDetailRaw["pinnedMessage"]> & EnrichedMessage) | null;
};

type ConversationLike = ConversationListItem | ConversationDetail;

type ChatPageProps = {
  searchParams: Promise<SearchParamsRecord>;
};

type MessageReactionRow = {
  messageId: string;
  emoji: string;
  userId: string;
};

function mapChatUser(
  user: ConversationLike["participants"][number]["user"],
): ChatUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    nickname: user.nickname,
    title: user.title,
    roleLabel: user.roleLabel,
    avatarColor: user.avatarColor,
    companyLogoUrl: user.companyLogoUrl,
    lastSeenAt: user.lastSeenAt,
  };
}

function getOtherParticipants(conversation: ConversationLike, currentUserId: string) {
  return conversation.participants
    .map((participant) => participant.user)
    .filter((participant) => participant.id !== currentUserId);
}

function getParticipantPreview(conversation: ConversationLike, currentUserId: string) {
  const participants = getOtherParticipants(conversation, currentUserId);

  if (participants.length) {
    return participants.map(mapChatUser);
  }

  return conversation.participants.map((participant) => mapChatUser(participant.user));
}

function getConversationTitle(
  conversation: ConversationLike,
  currentUserId: string,
  t: (key: string, values?: Record<string, string | number>) => string,
) {
  if (conversation.type === "GROUP") {
    return conversation.title || t("Group chat");
  }

  return getOtherParticipants(conversation, currentUserId)[0]?.name ?? t("Direct chat");
}

function getConversationSubtitle(
  conversation: ConversationLike,
  currentUserId: string,
  t: (key: string, values?: Record<string, string | number>) => string,
) {
  if (conversation.type === "GROUP") {
    return t("{count} members", { count: conversation.participants.length });
  }

  const teammate = getOtherParticipants(conversation, currentUserId)[0];
  return teammate?.nickname ? `@${teammate.nickname}` : teammate?.title || teammate?.roleLabel || teammate?.email || t("Direct chat");
}

function getConversationStatus(
  conversation: ConversationLike,
  currentUserId: string,
  locale: Locale,
  t: (key: string, values?: Record<string, string | number>) => string,
) {
  if (conversation.type === "GROUP") {
    const names = getOtherParticipants(conversation, currentUserId)
      .slice(0, 3)
      .map((participant) => participant.name);

    return names.length
      ? t("Active with {names}", { names: names.join(", ") })
      : t("{count} members", { count: conversation.participants.length });
  }

  const lastMessage = conversation.messages.at(-1) ?? conversation.messages[0];
  if (lastMessage) {
    return t("Last active {time}", { time: fromNow(lastMessage.createdAt, locale) });
  }

  const teammate = getOtherParticipants(conversation, currentUserId)[0];
  return teammate?.title || teammate?.roleLabel || teammate?.email || t("Direct chat");
}

function getMessagePreview(
  message: ConversationLike["messages"][number] | undefined,
  currentUserId: string,
  t: (key: string, values?: Record<string, string | number>) => string,
) {
  if (!message) {
    return t("No messages yet");
  }

  const prefix = message.senderId === currentUserId ? `${t("You")}: ` : "";

  if (message.body) {
    return `${prefix}${message.body}`;
  }

  if (message.mediaType === "IMAGE") {
    return `${prefix}${t("Photo")}`;
  }

  if (message.mediaType === "VIDEO") {
    return `${prefix}${t("Video")}`;
  }

  return t("No messages yet");
}

function getMessageGroupLabel(
  value: Date,
  locale: Locale,
  t: (key: string, values?: Record<string, string | number>) => string,
) {
  if (isToday(value)) {
    return t("Today");
  }

  if (isYesterday(value)) {
    return t("Yesterday");
  }

  return formatMonthDay(value, locale);
}

function getReplyPreview(
  message: NonNullable<ConversationDetail["messages"][number]["replyToMessage"]>,
  t: (key: string, values?: Record<string, string | number>) => string,
) {
  if (message.body) {
    return message.body;
  }

  if (message.mediaType === "IMAGE") {
    return t("Photo");
  }

  if (message.mediaType === "VIDEO") {
    return t("Video");
  }

  return t("Message");
}

function groupMessageReactions(
  reactions: MessageReactionRow[],
  currentUserId: string,
) {
  const grouped = new Map<string, { emoji: string; count: number; reacted: boolean }>();

  for (const reaction of reactions) {
    const current = grouped.get(reaction.emoji);

    if (current) {
      current.count += 1;
      current.reacted = current.reacted || reaction.userId === currentUserId;
      continue;
    }

    grouped.set(reaction.emoji, {
      emoji: reaction.emoji,
      count: 1,
      reacted: reaction.userId === currentUserId,
    });
  }

  return [...grouped.values()].sort((left, right) => right.count - left.count);
}

function mapConversationListItem(
  conversation: ConversationListItem,
  currentUserId: string,
  locale: Locale,
  searchParams: SearchParamsRecord,
  lastReadAtByConversationId: Map<string, Date>,
  t: (key: string, values?: Record<string, string | number>) => string,
): ChatConversationListItem {
  const lastMessage = conversation.messages[0];
  const lastReadAt = lastReadAtByConversationId.get(conversation.id);

  return {
    id: conversation.id,
    href: createPageHref("/dashboard/chat", searchParams, { conversation: conversation.id }),
    type: conversation.type,
    title: getConversationTitle(conversation, currentUserId, t),
    subtitle: getConversationSubtitle(conversation, currentUserId, t),
    lastMessagePreview: getMessagePreview(lastMessage, currentUserId, t),
    lastMessageTimeLabel: lastMessage ? fromNow(lastMessage.createdAt, locale) : "",
    unreadCount:
      lastMessage && lastReadAt && lastMessage.senderId !== currentUserId && lastMessage.createdAt > lastReadAt
        ? 1
        : 0,
    participants: getParticipantPreview(conversation, currentUserId),
  };
}

function mapActiveConversation(
  conversation: ConversationDetail,
  currentUserId: string,
  locale: Locale,
  lastReadAtByConversationId: Map<string, Date>,
  reactionsByMessageId: Map<string, MessageReactionRow[]>,
  backgroundPreference: ChatBackgroundPreference,
  t: (key: string, values?: Record<string, string | number>) => string,
): ActiveConversation {
  const participants = conversation.participants.map((participant) => mapChatUser(participant.user));
  const avatarParticipants = getParticipantPreview(conversation, currentUserId);
  const currentUserParticipant = conversation.participants.find((p) => p.userId === currentUserId);
  const lastMessage = conversation.messages.at(-1);
  const lastReadAt = lastReadAtByConversationId.get(conversation.id);
  const messageGroups = conversation.messages.reduce<
    Array<{
      label: string;
      items: ChatMessageItem[];
    }>
  >((groups, message) => {
    const label = getMessageGroupLabel(message.createdAt, locale, t);
    const item: ChatMessageItem = {
      id: message.id,
      sender: mapChatUser(message.sender),
      isCurrentUser: message.senderId === currentUserId,
      body: message.body,
      mediaUrl: message.mediaUrl,
      mediaType: message.mediaType,
      isForwarded: message.isForwarded,
      status: message.status,
      isEdited: Boolean(message.editedAt),
      replyTo: message.replyToMessage
        ? {
            id: message.replyToMessage.id,
            senderName: message.replyToMessage.sender.name,
            preview: getReplyPreview(message.replyToMessage, t),
            mediaType: message.replyToMessage.mediaType,
          }
        : null,
      reactions: groupMessageReactions(reactionsByMessageId.get(message.id) ?? [], currentUserId),
      poll: message.poll ? {
         id: message.poll.id,
         question: message.poll.question,
         options: message.poll.options.map((opt) => ({
             id: opt.id,
             text: opt.text,
             voteCount: opt.votes.length,
             hasVoted: opt.votes.some((v) => v.userId === currentUserId),
         }))
      } : undefined,
      timeLabel: formatDate(message.createdAt, locale, "HH:mm"),
    };

    const currentGroup = groups.at(-1);
    if (currentGroup?.label === label) {
      currentGroup.items.push(item);
      return groups;
    }

    groups.push({
      label,
      items: [item],
    });

    return groups;
  }, []);

  const sharedMedia = [...conversation.messages]
    .reverse()
    .filter((message) => Boolean(message.mediaUrl && message.mediaType))
    .slice(0, 6)
    .map((message) => ({
      id: message.id,
      mediaUrl: message.mediaUrl!,
      mediaType: message.mediaType!,
      previewLabel: message.body || (message.mediaType === "IMAGE" ? t("Photo") : t("Video")),
    }));

  return {
    id: conversation.id,
    type: conversation.type,
    title: getConversationTitle(conversation, currentUserId, t),
    subtitle:
      conversation.type === "GROUP"
        ? participants.map((participant) => participant.name).join(", ")
        : getConversationSubtitle(conversation, currentUserId, t),
    statusLabel: getConversationStatus(conversation, currentUserId, locale, t),
    hasUnread: Boolean(
      lastMessage &&
        lastReadAt &&
        lastMessage.senderId !== currentUserId &&
        lastMessage.createdAt > lastReadAt,
    ),
    participants: conversation.type === "DIRECT" ? avatarParticipants : participants,
    messageGroups,
    backgroundPreference,
    sharedMedia,
    participantDirectory: participants,
    mutedUntil: currentUserParticipant?.mutedUntil ?? null,
    pinnedMessage: conversation.pinnedMessage
      ? {
          id: conversation.pinnedMessage.id,
          body: conversation.pinnedMessage.body,
          mediaType: conversation.pinnedMessage.mediaType,
          senderName: conversation.pinnedMessage.sender.name,
        }
      : null,
  };
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const currentUser = await requireUser();
  const { locale, t } = await getServerTranslator();
  const resolvedSearchParams = await searchParams;
  const requestedConversationId = getParam(resolvedSearchParams, "conversation");
  const backgroundPreference: ChatBackgroundPreference = {
    type: currentUser.chatBackgroundType,
    color: currentUser.chatBackgroundColor,
    imageUrl: currentUser.chatBackgroundImageUrl,
  };

  await chatDb.chatMessage.updateMany({
    where: {
      senderId: {
        not: currentUser.id,
      },
      status: "SENT",
      conversation: {
        participants: {
          some: {
            userId: currentUser.id,
          },
        },
      },
    },
    data: {
      status: "DELIVERED",
    },
  });

  const [visibleUsers, rawConversations, chatReadStates] = await Promise.all([
    prisma.user.findMany({
      where: chatUsersWhere(currentUser),
      select: chatUserSelect,
      orderBy: {
        name: "asc",
      },
    }),
    chatDb.chatConversation.findMany({
      where: {
        participants: {
          some: {
            userId: currentUser.id,
          },
        },
      },
      orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
      include: conversationListInclude,
    }),
    chatDb.$queryRaw<Array<{ conversationId: string; lastReadAt: Date }>>`
      SELECT "conversationId", "lastReadAt"
      FROM "ChatParticipant"
      WHERE "userId" = ${currentUser.id}
    `,
  ]);
  const lastReadAtByConversationId = new Map(chatReadStates.map((item) => [item.conversationId, item.lastReadAt]));

  const userMap = new Map<string, ChatDirectoryUser>(
    visibleUsers.map((user): [string, ChatDirectoryUser] => [user.id, user]),
  );

  const fallbackUser: ChatDirectoryUser = {
    id: "unknown",
    name: t("Unknown User"),
    email: "",
    nickname: null,
    title: null,
    roleLabel: null,
    avatarColor: "#000000",
    companyLogoUrl: null,
    lastSeenAt: null,
  };

  const conversations = rawConversations.map((conv) => ({
    ...conv,
    participants: conv.participants.map((p) => ({
      ...p,
      user: userMap.get(p.userId) ?? { ...fallbackUser, id: p.userId },
    })),
    messages: conv.messages.map((m) => ({
      ...m,
      sender: userMap.get(m.senderId) ?? { ...fallbackUser, id: m.senderId },
    })),
  })) as ConversationListItem[];

  const teammates = visibleUsers.filter((user) => user.id !== currentUser.id).map(mapChatUser);
  const conversationItems = conversations.map((conversation) =>
    mapConversationListItem(conversation, currentUser.id, locale, resolvedSearchParams, lastReadAtByConversationId, t),
  );
  const selectedConversationId =
    requestedConversationId && conversations.some((conversation) => conversation.id === requestedConversationId)
      ? requestedConversationId
      : conversations[0]?.id ?? "";

  const activeConversationRaw = selectedConversationId
    ? await chatDb.chatConversation.findFirst({
        where: {
          id: selectedConversationId,
          participants: {
            some: {
              userId: currentUser.id,
            },
          },
        },
        include: conversationDetailInclude,
      })
    : null;

  const activeConversation = activeConversationRaw
    ? ({
        ...activeConversationRaw,
        participants: activeConversationRaw.participants.map((p) => ({
          ...p,
          user: userMap.get(p.userId) ?? { ...fallbackUser, id: p.userId },
        })),
        messages: activeConversationRaw.messages.map((m) => ({
          ...m,
          sender: userMap.get(m.senderId) ?? { ...fallbackUser, id: m.senderId },
          replyToMessage: m.replyToMessage
            ? {
                ...m.replyToMessage,
                sender: userMap.get(m.replyToMessage.senderId) ?? { ...fallbackUser, id: m.replyToMessage.senderId },
              }
            : null,
        })),
        pinnedMessage: activeConversationRaw.pinnedMessage
          ? {
              ...activeConversationRaw.pinnedMessage,
              sender: userMap.get(activeConversationRaw.pinnedMessage.senderId) ?? { ...fallbackUser, id: activeConversationRaw.pinnedMessage.senderId },
            }
          : null,
      } as ConversationDetail)
    : null;

  const activeConversationMessageIds = activeConversation?.messages.map((message) => message.id) ?? [];
  const activeConversationReactions = activeConversationMessageIds.length
    ? await chatDb.$queryRaw<MessageReactionRow[]>(
        ChatPrisma.sql`
          SELECT "messageId", "emoji", "userId"
          FROM "ChatMessageReaction"
          WHERE "messageId" IN (${ChatPrisma.join(activeConversationMessageIds)})
          ORDER BY "createdAt" ASC
        `,
      )
    : [];
  const reactionsByMessageId = activeConversationReactions.reduce<Map<string, MessageReactionRow[]>>((accumulator, reaction) => {
    const current = accumulator.get(reaction.messageId);

    if (current) {
      current.push(reaction);
      return accumulator;
    }

    accumulator.set(reaction.messageId, [reaction]);
    return accumulator;
  }, new Map());

  return (
    <ChatWorkspace
      conversations={conversationItems}
      activeConversation={
        activeConversation
          ? mapActiveConversation(
              activeConversation,
              currentUser.id,
              locale,
              lastReadAtByConversationId,
              reactionsByMessageId,
              backgroundPreference,
              t,
            )
          : null
      }
      teammates={teammates}
      backgroundPreference={backgroundPreference}
    />
  );
}
