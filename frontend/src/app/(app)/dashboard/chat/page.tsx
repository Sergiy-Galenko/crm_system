import type { Prisma } from "@prisma/client";
import { isToday, isYesterday } from "date-fns";
import { prisma } from "@/lib/db";
import { getParam, createPageHref, type SearchParamsRecord } from "@/lib/query-params";
import { formatDate, fromNow } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { ChatWorkspace } from "@/components/chat/chat-workspace";
import type { ActiveConversation, ChatBackgroundPreference, ChatConversationListItem, ChatMessageItem, ChatUser } from "@/components/chat/chat-types";
import { getServerTranslator } from "@/lib/locale-server";
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
} satisfies Prisma.UserSelect;

const conversationListInclude = {
  participants: {
    orderBy: {
      joinedAt: "asc",
    },
    select: {
      user: {
        select: chatUserSelect,
      },
    },
  },
  messages: {
    take: 1,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      sender: {
        select: chatUserSelect,
      },
    },
  },
} satisfies Prisma.ChatConversationInclude;

const conversationDetailInclude = {
  participants: {
    orderBy: {
      joinedAt: "asc",
    },
    select: {
      user: {
        select: chatUserSelect,
      },
    },
  },
  messages: {
    orderBy: {
      createdAt: "asc",
    },
    include: {
      sender: {
        select: chatUserSelect,
      },
      replyToMessage: {
        select: {
          id: true,
          body: true,
          mediaType: true,
          sender: {
            select: chatUserSelect,
          },
        },
      },
    },
  },
} satisfies Prisma.ChatConversationInclude;

type ConversationListItem = Prisma.ChatConversationGetPayload<{ include: typeof conversationListInclude }>;
type ConversationDetail = Prisma.ChatConversationGetPayload<{ include: typeof conversationDetailInclude }>;
type ConversationLike = ConversationListItem | ConversationDetail;

type ChatPageProps = {
  searchParams: Promise<SearchParamsRecord>;
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
  locale: "en" | "uk",
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
  locale: "en" | "uk",
  t: (key: string, values?: Record<string, string | number>) => string,
) {
  if (isToday(value)) {
    return t("Today");
  }

  if (isYesterday(value)) {
    return t("Yesterday");
  }

  return formatDate(value, locale, locale === "uk" ? "d MMMM" : "MMM d");
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

function mapConversationListItem(
  conversation: ConversationListItem,
  currentUserId: string,
  locale: "en" | "uk",
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
  locale: "en" | "uk",
  lastReadAtByConversationId: Map<string, Date>,
  backgroundPreference: ChatBackgroundPreference,
  t: (key: string, values?: Record<string, string | number>) => string,
): ActiveConversation {
  const participants = conversation.participants.map((participant) => mapChatUser(participant.user));
  const avatarParticipants = getParticipantPreview(conversation, currentUserId);
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

  await prisma.chatMessage.updateMany({
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

  const [visibleUsers, conversations, chatReadStates] = await Promise.all([
    prisma.user.findMany({
      where: chatUsersWhere(currentUser),
      select: chatUserSelect,
      orderBy: {
        name: "asc",
      },
    }),
    prisma.chatConversation.findMany({
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
    prisma.$queryRaw<Array<{ conversationId: string; lastReadAt: Date }>>`
      SELECT "conversationId", "lastReadAt"
      FROM "ChatParticipant"
      WHERE "userId" = ${currentUser.id}
    `,
  ]);
  const lastReadAtByConversationId = new Map(chatReadStates.map((item) => [item.conversationId, item.lastReadAt]));

  const teammates = visibleUsers.filter((user) => user.id !== currentUser.id).map(mapChatUser);
  const conversationItems = conversations.map((conversation) =>
    mapConversationListItem(conversation, currentUser.id, locale, resolvedSearchParams, lastReadAtByConversationId, t),
  );
  const selectedConversationId =
    requestedConversationId && conversations.some((conversation) => conversation.id === requestedConversationId)
      ? requestedConversationId
      : conversations[0]?.id ?? "";

  const activeConversation = selectedConversationId
    ? await prisma.chatConversation.findFirst({
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

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t("Workspace")}
        title={t("Chat")}
        description={t("Keep direct and group conversations close to your deals, renewals, and daily client follow-ups.")}
      />

      <ChatWorkspace
        conversations={conversationItems}
        activeConversation={
          activeConversation
            ? mapActiveConversation(activeConversation, currentUser.id, locale, lastReadAtByConversationId, backgroundPreference, t)
            : null
        }
        teammates={teammates}
        backgroundPreference={backgroundPreference}
      />
    </div>
  );
}
