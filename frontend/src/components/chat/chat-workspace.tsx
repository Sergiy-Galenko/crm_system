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
    <div className="grid h-full min-w-0">
      {/* ── Messages column ── */}
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

        {/* Scrollable message viewport */}
        <div ref={messageViewportRef} className="relative min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-5 md:px-6 lg:px-8 scrollbar-subtle">
          {filteredMessageGroups.length ? (
            <div className="mx-auto flex max-w-5xl flex-col gap-6">
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

        {/* Composer / input bar */}
        <div className="sticky bottom-0 z-10 border-t border-white/10 bg-[linear-gradient(180deg,rgba(10,15,28,0.32),rgba(10,15,28,0.78))] px-3 py-3 backdrop-blur-[26px] sm:px-5 md:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
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

      {/* Overlay backdrop — always covers messages area */}
      {isProfileOpen ? (
        <button
          type="button"
          aria-label={t("Close details")}
          className="absolute inset-0 z-20 bg-[var(--ui-overlay)] backdrop-blur-sm"
          onClick={onToggleProfile}
        />
      ) : null}

      {/* Sliding profile drawer — always overlay on every screen size */}
      <div
        className={cn(
          "absolute inset-y-0 right-0 z-30 w-[min(22rem,calc(100vw-1rem))] border-l border-white/10 bg-[linear-gradient(180deg,rgba(6,11,25,0.96),rgba(15,23,42,0.92))] shadow-[-24px_0_70px_rgba(2,6,23,0.45)] backdrop-blur transition-transform duration-300",
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

  // Close mobile sidebar when a conversation is selected
  function handleSelectConversation() {
    setIsSidebarOpen(false);
  }

  return (
    /*
     * Height strategy:
     *   - 100dvh  = full dynamic viewport (accounts for mobile browser chrome)
     *   - minus AppShell header (~4.25rem) + its top gap (~1rem, from py-4 * 2 / 2)
     *   - minus the rounded card's own border (visual correction)
     * Result: the workspace fills the screen exactly without a page-level scrollbar.
     */
    <section
      className="relative flex flex-col overflow-hidden rounded-[2.25rem] border border-white/10 bg-[linear-gradient(180deg,#08101d,#0f172a)] shadow-[0_38px_110px_rgba(2,6,23,0.48)]"
      style={{ height: "calc(100dvh - var(--shell-header-h) - var(--shell-gap-y) - 2.5rem)" }}
    >
      {/* Ambient gradient overlays */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_24%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.1),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.08),transparent_24%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent)]" />

      {/*
       * Inner grid: sidebar | main content
       *   < md  → sidebar hidden (full-screen drawer on demand)
       *   md+   → 18rem sidebar | flex-1 messages
       *   xl+   → 20rem sidebar | flex-1 messages
       */}
      <div className="relative grid min-h-0 flex-1 md:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[20rem_minmax(0,1fr)]">

        {/* ── Desktop sidebar (md+) ── */}
        <div className="hidden min-h-0 border-r border-white/10 md:block">
          <ChatSidebar
            chats={conversations}
            activeConversationId={activeConversation?.id}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectConversation={handleSelectConversation}
            newChatAction={<ChatConversationDialog teammates={teammates} />}
          />
        </div>

        {/* ── Mobile sidebar drawer (< md) ── */}
        <div
          className={cn(
            "absolute inset-y-0 left-0 z-30 w-[min(20rem,calc(100vw-3rem))] border-r border-white/10 bg-[linear-gradient(180deg,rgba(6,11,25,0.98),rgba(15,23,42,0.94))] shadow-[0_30px_90px_rgba(2,6,23,0.52)] backdrop-blur transition-transform duration-300 md:hidden",
            isSidebarOpen ? "translate-x-0" : "-translate-x-[105%]",
          )}
        >
          <ChatSidebar
            chats={conversations}
            activeConversationId={activeConversation?.id}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectConversation={handleSelectConversation}
            newChatAction={<ChatConversationDialog teammates={teammates} />}
            onCloseMobile={() => setIsSidebarOpen(false)}
            showMobileClose
          />
        </div>

        {/* Mobile sidebar backdrop */}
        {isSidebarOpen ? (
          <button
            type="button"
            aria-label={t("Close sidebar")}
            className="absolute inset-0 z-20 bg-[var(--ui-overlay)] backdrop-blur-sm md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        ) : null}

        {/* ── Main content area ── */}
        <div className="relative min-h-0 flex flex-col">
          {activeConversation ? (
            <div className="relative flex-1 flex flex-col min-h-0">
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
            </div>
          ) : (
            /* Empty / welcome state */
            <div className="relative flex flex-1 items-center justify-center overflow-hidden px-5 py-10">
              <ChatBackgroundLayer preference={previewBackground} />
              <div className="relative w-full max-w-xl rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(15,23,42,0.7))] p-7 text-center shadow-[0_26px_70px_rgba(2,6,23,0.36)] backdrop-blur sm:p-10">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-[1.5rem] bg-[linear-gradient(135deg,#2563eb,#0f766e)] text-white shadow-[0_24px_60px_rgba(37,99,235,0.26)]">
                  <Sparkles className="h-7 w-7" />
                </div>
                <h2 className="mt-6 text-2xl font-semibold tracking-tight text-white">
                  {conversations.length ? t("Select a conversation") : t("No conversations yet")}
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/62">
                  {conversations.length
                    ? t("Choose a chat from the list or create a new one to start messaging your team.")
                    : teammates.length
                      ? t("Start a direct chat or create a group, then keep drafts, replies, files, and link sharing in one premium thread.")
                      : t("No teammates available for chat yet.")}
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <ChatConversationDialog teammates={teammates} />
                  <Button type="button" variant="secondary" onClick={() => setIsSidebarOpen(true)} className="md:hidden">
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
