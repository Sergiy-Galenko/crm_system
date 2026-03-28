import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getParam, createPageHref, type SearchParamsRecord } from "@/lib/query-params";
import { cn, fromNow } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { ChatConversationDialog } from "@/components/forms/chat-conversation-dialog";
import { ChatComposer } from "@/components/chat/chat-composer";
import { EmptyState } from "@/components/ui/empty-state";
import { UserAvatar } from "@/components/ui/avatar";
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
    },
  },
} satisfies Prisma.ChatConversationInclude;

type ConversationListItem = Prisma.ChatConversationGetPayload<{ include: typeof conversationListInclude }>;
type ConversationDetail = Prisma.ChatConversationGetPayload<{ include: typeof conversationDetailInclude }>;
type ConversationLike = ConversationListItem | ConversationDetail;

type ChatPageProps = {
  searchParams: Promise<SearchParamsRecord>;
};

function getOtherParticipants(conversation: ConversationLike, currentUserId: string) {
  return conversation.participants
    .map((participant) => participant.user)
    .filter((participant) => participant.id !== currentUserId);
}

function getConversationTitle(conversation: ConversationLike, currentUserId: string, t: (key: string, values?: Record<string, string | number>) => string) {
  if (conversation.type === "GROUP") {
    return conversation.title || t("Group chat");
  }

  return getOtherParticipants(conversation, currentUserId)[0]?.name ?? t("Direct chat");
}

function getConversationMeta(conversation: ConversationLike, currentUserId: string, t: (key: string, values?: Record<string, string | number>) => string) {
  if (conversation.type === "GROUP") {
    return t("{count} participants", { count: conversation.participants.length });
  }

  const teammate = getOtherParticipants(conversation, currentUserId)[0];
  return teammate?.title || teammate?.roleLabel || teammate?.email || t("Direct chat");
}

function ConversationAvatar({
  conversation,
  currentUserId,
  className,
}: {
  conversation: ConversationLike;
  currentUserId: string;
  className?: string;
}) {
  const participants = getOtherParticipants(conversation, currentUserId);

  if (conversation.type === "DIRECT") {
    const teammate = participants[0] ?? conversation.participants[0]?.user;

    if (!teammate) {
      return <div className={cn("h-12 w-12 rounded-[1.4rem] bg-slate-100", className)} />;
    }

    return (
      <UserAvatar
        name={teammate.name}
        color={teammate.avatarColor}
        imageUrl={teammate.companyLogoUrl}
        className={cn("h-12 w-12 rounded-[1.4rem]", className)}
      />
    );
  }

  const previewParticipants = participants.slice(0, 2);

  return (
    <div className={cn("relative h-12 w-[3.75rem]", className)}>
      {previewParticipants.map((participant, index) => (
        <UserAvatar
          key={participant.id}
          name={participant.name}
          color={participant.avatarColor}
          imageUrl={participant.companyLogoUrl}
          className={cn(
            "absolute top-0 h-10 w-10 rounded-[1.15rem] border-2 border-white bg-white shadow-sm",
            index === 0 ? "left-0" : "left-6 top-2",
          )}
        />
      ))}
    </div>
  );
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const currentUser = await requireUser();
  const { locale, t } = await getServerTranslator();
  const resolvedSearchParams = await searchParams;
  const requestedConversationId = getParam(resolvedSearchParams, "conversation");

  const [visibleUsers, conversations] = await Promise.all([
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
  ]);

  const teammates = visibleUsers.filter((user) => user.id !== currentUser.id);
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
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("Workspace")}
        title={t("Chat")}
        description={t("Keep direct and group conversations close to your deals, renewals, and daily client follow-ups.")}
        actions={<ChatConversationDialog teammates={teammates} />}
      />

      {conversations.length ? (
        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="card overflow-hidden rounded-[2rem] p-3">
            <div className="space-y-2">
              {conversations.map((conversation) => {
                const lastMessage = conversation.messages[0];
                const conversationTitle = getConversationTitle(conversation, currentUser.id, t);
                const conversationMeta = getConversationMeta(conversation, currentUser.id, t);
                const isActive = conversation.id === selectedConversationId;

                return (
                  <Link
                    key={conversation.id}
                    href={createPageHref("/dashboard/chat", resolvedSearchParams, { conversation: conversation.id })}
                    className={cn(
                      "grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-[1.6rem] border px-4 py-4 transition",
                      isActive
                        ? "border-slate-950 bg-slate-950 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                    )}
                  >
                    <ConversationAvatar conversation={conversation} currentUserId={currentUser.id} />
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{conversationTitle}</p>
                          <p className={cn("truncate text-xs leading-5", isActive ? "text-slate-300" : "text-slate-500")}>
                            {conversationMeta}
                          </p>
                        </div>
                        {lastMessage ? (
                          <span className={cn("shrink-0 text-[11px]", isActive ? "text-slate-300" : "text-slate-400")}>
                            {fromNow(lastMessage.createdAt, locale)}
                          </span>
                        ) : null}
                      </div>
                      <p className={cn("mt-2 truncate text-sm", isActive ? "text-slate-100" : "text-slate-500")}>
                        {lastMessage?.body || t("No messages yet")}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {activeConversation ? (
            <div className="card flex min-h-[42rem] flex-col overflow-hidden rounded-[2rem]">
              <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
                <div className="flex items-center gap-4">
                  <ConversationAvatar conversation={activeConversation} currentUserId={currentUser.id} className="shrink-0" />
                  <div className="min-w-0">
                    <h2 className="truncate text-xl font-semibold text-slate-950">
                      {getConversationTitle(activeConversation, currentUser.id, t)}
                    </h2>
                    <p className="truncate text-sm leading-6 text-slate-500">
                      {activeConversation.type === "GROUP"
                        ? activeConversation.participants.map((participant) => participant.user.name).join(", ")
                        : getConversationMeta(activeConversation, currentUser.id, t)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
                {activeConversation.messages.length ? (
                  <div className="space-y-4">
                    {activeConversation.messages.map((message) => {
                      const isCurrentUser = message.senderId === currentUser.id;

                      return (
                        <div
                          key={message.id}
                          className={cn("flex gap-3", isCurrentUser ? "justify-end" : "justify-start")}
                        >
                          {!isCurrentUser ? (
                            <UserAvatar
                              name={message.sender.name}
                              color={message.sender.avatarColor}
                              imageUrl={message.sender.companyLogoUrl}
                              className="mt-6 h-10 w-10 shrink-0 rounded-[1.15rem]"
                            />
                          ) : null}
                          <div className={cn("max-w-[min(100%,38rem)] space-y-1", isCurrentUser ? "text-right" : "")}>
                            <p className="text-xs text-slate-500">
                              <span className="font-medium text-slate-700">{message.sender.name}</span>
                              {" • "}
                              {fromNow(message.createdAt, locale)}
                            </p>
                            <div
                              className={cn(
                                "rounded-[1.6rem] px-4 py-3 text-sm leading-6 shadow-sm",
                                isCurrentUser ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-900",
                              )}
                            >
                              <p className="whitespace-pre-wrap break-words">{message.body}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <EmptyState
                      title={t("No messages yet")}
                      description={t("Send the first message to start this thread.")}
                    />
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 bg-slate-50/70 px-5 py-5 sm:px-6">
                <ChatComposer conversationId={activeConversation.id} />
              </div>
            </div>
          ) : (
            <EmptyState
              title={t("Select a conversation")}
              description={t("Choose a chat from the list or create a new one to start messaging your team.")}
            />
          )}
        </div>
      ) : (
        <EmptyState
          title={teammates.length ? t("No conversations yet") : t("No teammates available")}
          description={
            teammates.length
              ? t("Start a direct chat or create a group to keep decisions and follow-ups in one place.")
              : t("No teammates available for chat yet.")
          }
        />
      )}
    </div>
  );
}
