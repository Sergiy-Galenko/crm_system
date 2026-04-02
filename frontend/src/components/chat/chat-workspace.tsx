"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState, startTransition } from "react";
import { PanelRightClose, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { markConversationReadAction, pinMessageAction } from "@/actions/chat";
import { ChatBackgroundLayer } from "@/components/chat/chat-background-layer";
import { ChatConversationDialog } from "@/components/forms/chat-conversation-dialog";
import { ChatForwardDialog } from "@/components/chat/chat-forward-dialog";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { ChatHeader } from "./chat-header";
import { ChatSidebar } from "./chat-sidebar";
import { MessageGroup } from "./message-group";
import { MessageInput } from "./message-input";
import type { ActiveConversation, ChatBackgroundPreference, ChatConversationListItem, ChatMessageItem, ChatUser } from "./chat-types";
import { UserProfilePanel } from "./user-profile-panel";

function ActiveConversationPanel({
  conversation,
  backgroundPreference,
  isProfileOpen,
  onOpenSidebar,
  onToggleProfile,
  onBackgroundChange,
  conversations,
}: {
  conversation: ActiveConversation;
  backgroundPreference: ChatBackgroundPreference;
  isProfileOpen: boolean;
  onOpenSidebar: () => void;
  onToggleProfile: () => void;
  onBackgroundChange: (value: ChatBackgroundPreference) => void;
  conversations: ChatConversationListItem[];
}) {
  const { t } = useLocale();
  const [messageSearchOpen, setMessageSearchOpen] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [replyToMessage, setReplyToMessage] = useState<ChatMessageItem | null>(null);
  const [forwardMessage, setForwardMessage] = useState<ChatMessageItem | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessageItem | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const deferredMessageSearchQuery = useDeferredValue(messageSearchQuery);
  const messageViewportRef = useRef<HTMLDivElement>(null);
  const lastSyncedConversationIdRef = useRef<string | null>(null);
  const highlightTimeoutRef = useRef<number | null>(null);
  const router = useRouter();
  const filteredMessageGroups = useMemo(() => {
    const normalizedQuery = deferredMessageSearchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return conversation.messageGroups;
    }

    return conversation.messageGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((message) =>
          [
            message.body ?? "",
            message.replyTo?.preview ?? "",
            message.sender.name,
            message.sender.nickname ? `@${message.sender.nickname}` : "",
            message.mediaType === "IMAGE" ? t("Photo") : message.mediaType === "VIDEO" ? t("Video") : "",
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [conversation.messageGroups, deferredMessageSearchQuery, t]);
  const searchResultCount = filteredMessageGroups.reduce((count, group) => count + group.items.length, 0);

  useEffect(() => {
    if (!conversation.hasUnread || lastSyncedConversationIdRef.current === conversation.id) {
      return;
    }

    lastSyncedConversationIdRef.current = conversation.id;

    void markConversationReadAction(conversation.id).then(() => {
      router.refresh();
    });
  }, [conversation.hasUnread, conversation.id, router]);

  useEffect(() => () => {
    if (highlightTimeoutRef.current) {
      window.clearTimeout(highlightTimeoutRef.current);
    }
  }, []);

  function scrollToLatestMessage() {
    const viewport = messageViewportRef.current;

    if (!viewport) {
      return;
    }

    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior: "smooth",
    });
  }

  function jumpToMessage(messageId: string) {
    const messageElement = document.getElementById(`chat-message-${messageId}`);

    if (!messageElement) {
      return;
    }

    messageElement.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    setHighlightedMessageId(messageId);

    if (highlightTimeoutRef.current) {
      window.clearTimeout(highlightTimeoutRef.current);
    }

    highlightTimeoutRef.current = window.setTimeout(() => {
      setHighlightedMessageId((current) => (current === messageId ? null : current));
    }, 1800);
  }

  return (
    <div className="grid h-full min-h-[calc(100vh-11.5rem)] min-w-0 2xl:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="relative flex min-h-0 min-w-0 flex-col">
        <ChatBackgroundLayer preference={backgroundPreference} />
        <ChatHeader
          conversation={conversation}
          onOpenSidebar={onOpenSidebar}
          onToggleProfile={onToggleProfile}
          onToggleSearch={() => {
            setMessageSearchOpen((current) => !current);
          }}
          onSearchChange={setMessageSearchQuery}
          onClearSearch={() => setMessageSearchQuery("")}
          onJumpToLatest={scrollToLatestMessage}
          profileOpen={isProfileOpen}
          searchOpen={messageSearchOpen}
          searchQuery={messageSearchQuery}
          searchResultCount={searchResultCount}
        />

        <div ref={messageViewportRef} className="relative min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
          {filteredMessageGroups.length ? (
            <div className="mx-auto flex max-w-4xl flex-col gap-6">
              {filteredMessageGroups.map((group) => (
                <MessageGroup
                  key={group.label}
                  group={group}
                  conversation={conversation}
                  highlightedMessageId={highlightedMessageId}
                  onEditMessage={(message) => {
                    setEditingMessage(message);
                    setReplyToMessage(null);
                  }}
                  onJumpToMessage={jumpToMessage}
                  onReplyToMessage={(message) => {
                    setReplyToMessage(message);
                    setEditingMessage(null);
                  }}
                  onForwardMessage={(message) => {
                    setForwardMessage(message);
                  }}
                  onPinMessage={(messageId) => {
                     startTransition(async () => {
                        await pinMessageAction(conversation.id, messageId);
                     });
                  }}
                />
              ))}
            </div>
          ) : messageSearchQuery.trim() ? (
            <div className="flex h-full items-center justify-center py-12">
              <EmptyState
                title={t("No messages match this search.")}
                description={t("Try another keyword or clear the message search to see the whole conversation.")}
                actionLabel={t("Clear search")}
                onAction={() => setMessageSearchQuery("")}
              />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center py-12">
              <EmptyState
                title={t("No messages yet")}
                description={t("Send the first message, paste a link, or drop a file to start this thread with a cleaner workspace feel.")}
              />
            </div>
          )}
        </div>

        <div className="sticky bottom-0 z-10 border-t border-[var(--ui-border)] bg-[color-mix(in_srgb,var(--ui-surface-solid)_88%,transparent)] px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <MessageInput
              key={editingMessage ? `${conversation.id}:edit:${editingMessage.id}` : `${conversation.id}:compose`}
              conversationId={conversation.id}
              editingMessage={editingMessage}
              replyToMessage={replyToMessage}
              onCancelEdit={() => setEditingMessage(null)}
              onCancelReply={() => setReplyToMessage(null)}
              onJumpToMessage={jumpToMessage}
              onSubmitted={() => {
                setReplyToMessage(null);
                setEditingMessage(null);
              }}
            />
          </div>
        </div>
      </section>
      
      <ChatForwardDialog
        isOpen={!!forwardMessage}
        onClose={() => setForwardMessage(null)}
        message={forwardMessage}
        conversations={conversations}
      />

      <div className="hidden min-h-0 border-l border-[var(--ui-border)] bg-[color-mix(in_srgb,var(--ui-surface-solid)_74%,transparent)] 2xl:block">
        <UserProfilePanel conversation={conversation} backgroundPreference={backgroundPreference} onBackgroundChange={onBackgroundChange} />
      </div>

      <div
        className={cn(
          "absolute inset-y-0 right-0 z-30 w-[min(22rem,calc(100vw-1rem))] border-l border-[var(--ui-border)] bg-[color-mix(in_srgb,var(--ui-surface-solid)_96%,transparent)] shadow-[-18px_0_60px_rgba(15,23,42,0.16)] backdrop-blur transition-transform duration-300 2xl:hidden",
          isProfileOpen ? "translate-x-0" : "translate-x-[105%]",
        )}
      >
        <UserProfilePanel
          conversation={conversation}
          backgroundPreference={backgroundPreference}
          onBackgroundChange={onBackgroundChange}
          onClose={onToggleProfile}
          showMobileClose
        />
      </div>
    </div>
  );
}

export function ChatWorkspace({
  conversations,
  activeConversation,
  teammates,
  backgroundPreference,
}: {
  conversations: ChatConversationListItem[];
  activeConversation: ActiveConversation | null;
  teammates: ChatUser[];
  backgroundPreference: ChatBackgroundPreference;
}) {
  const { t } = useLocale();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [previewBackground, setPreviewBackground] = useState(backgroundPreference);

  useEffect(() => {
    setPreviewBackground(backgroundPreference);
  }, [backgroundPreference]);

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-[var(--ui-border)] bg-[linear-gradient(180deg,var(--ui-surface-solid),var(--ui-surface-muted))] shadow-[var(--ui-shadow-strong)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(148,163,184,0.1),transparent_28%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.08),transparent_26%)]" />

      <div className="relative grid min-h-[calc(100vh-11.5rem)] xl:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="hidden min-h-0 border-r border-[var(--ui-border)] xl:block">
          <ChatSidebar
            chats={conversations}
            activeConversationId={activeConversation?.id}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectConversation={() => {
              setIsSidebarOpen(false);
            }}
            newChatAction={<ChatConversationDialog teammates={teammates} />}
          />
        </div>

        <div
          className={cn(
            "absolute inset-y-0 left-0 z-30 w-[min(23rem,calc(100vw-1rem))] border-r border-[var(--ui-border)] bg-[var(--ui-surface-solid)] shadow-[var(--ui-shadow-strong)] backdrop-blur transition-transform duration-300 xl:hidden",
            isSidebarOpen ? "translate-x-0" : "-translate-x-[105%]",
          )}
        >
          <ChatSidebar
            chats={conversations}
            activeConversationId={activeConversation?.id}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectConversation={() => {
              setIsSidebarOpen(false);
            }}
            newChatAction={<ChatConversationDialog teammates={teammates} />}
            onCloseMobile={() => setIsSidebarOpen(false)}
            showMobileClose
          />
        </div>

        {isSidebarOpen ? (
          <button
            type="button"
            aria-label={t("Close sidebar")}
            className="absolute inset-0 z-20 bg-[var(--ui-overlay)] xl:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        ) : null}

        <div className="relative min-h-0">
          {activeConversation ? (
            <div className="relative">
              <ActiveConversationPanel
                key={activeConversation.id}
                conversation={activeConversation}
                conversations={conversations}
                backgroundPreference={previewBackground}
                isProfileOpen={isProfileOpen}
                onOpenSidebar={() => setIsSidebarOpen(true)}
                onToggleProfile={() => setIsProfileOpen((current) => !current)}
                onBackgroundChange={setPreviewBackground}
              />
              {isProfileOpen ? (
                <button
                  type="button"
                  aria-label={t("Close details")}
                  className="absolute inset-0 z-20 bg-[var(--ui-overlay)] 2xl:hidden"
                  onClick={() => setIsProfileOpen(false)}
                />
              ) : null}
            </div>
          ) : (
            <div className="relative flex min-h-[calc(100vh-11.5rem)] items-center justify-center overflow-hidden px-6 py-10">
              <ChatBackgroundLayer preference={previewBackground} />
              <div className="relative w-full max-w-2xl rounded-[2rem] border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] p-8 text-center shadow-[var(--ui-shadow-soft)] backdrop-blur">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-[1.5rem] bg-[var(--ui-brand)] text-[var(--ui-brand-foreground)] shadow-[var(--ui-shadow-strong)]">
                  <Sparkles className="h-7 w-7" />
                </div>
                <h2 className="mt-6 text-2xl font-semibold tracking-tight text-slate-950">
                  {conversations.length ? t("Select a conversation") : t("No conversations yet")}
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
                  {conversations.length
                    ? t("Choose a chat from the list or create a new one to start messaging your team.")
                    : teammates.length
                      ? t("Start a direct chat or create a group, then keep drafts, replies, files, and link sharing in one premium thread.")
                      : t("No teammates available for chat yet.")}
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <ChatConversationDialog teammates={teammates} />
                  <Button type="button" variant="secondary" onClick={() => setIsSidebarOpen(true)} className="xl:hidden">
                    <PanelRightClose className="h-4 w-4" />
                    {t("All chats")}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
