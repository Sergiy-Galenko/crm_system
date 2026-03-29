"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { PanelRightClose, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { markConversationReadAction } from "@/actions/chat";
import { ChatConversationDialog } from "@/components/forms/chat-conversation-dialog";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { ChatHeader } from "./chat-header";
import { ChatSidebar } from "./chat-sidebar";
import { MessageGroup } from "./message-group";
import { MessageInput } from "./message-input";
import type { ActiveConversation, ChatConversationListItem, ChatUser } from "./chat-types";
import { UserProfilePanel } from "./user-profile-panel";

function ActiveConversationPanel({
  conversation,
  isProfileOpen,
  onOpenSidebar,
  onToggleProfile,
}: {
  conversation: ActiveConversation;
  isProfileOpen: boolean;
  onOpenSidebar: () => void;
  onToggleProfile: () => void;
}) {
  const { t } = useLocale();
  const [messageSearchOpen, setMessageSearchOpen] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const deferredMessageSearchQuery = useDeferredValue(messageSearchQuery);
  const messageViewportRef = useRef<HTMLDivElement>(null);
  const lastSyncedConversationIdRef = useRef<string | null>(null);
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

  return (
    <div className="grid h-full min-h-[calc(100vh-11.5rem)] min-w-0 2xl:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="relative flex min-h-0 min-w-0 flex-col bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(248,250,252,0.96))]">
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

        <div ref={messageViewportRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
          {filteredMessageGroups.length ? (
            <div className="mx-auto flex max-w-4xl flex-col gap-6">
              {filteredMessageGroups.map((group) => (
                <MessageGroup key={group.label} group={group} conversation={conversation} />
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
                description={t("Send the first message to start this thread.")}
              />
            </div>
          )}
        </div>

        <div className="sticky bottom-0 z-10 border-t border-slate-200/80 bg-white/90 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <MessageInput conversationId={conversation.id} />
          </div>
        </div>
      </section>

      <div className="hidden min-h-0 border-l border-slate-200/80 bg-white/72 2xl:block">
        <UserProfilePanel conversation={conversation} />
      </div>

      <div
        className={cn(
          "absolute inset-y-0 right-0 z-30 w-[min(22rem,calc(100vw-1rem))] border-l border-slate-200/80 bg-white/96 shadow-[-18px_0_60px_rgba(15,23,42,0.16)] backdrop-blur transition-transform duration-300 2xl:hidden",
          isProfileOpen ? "translate-x-0" : "translate-x-[105%]",
        )}
      >
        <UserProfilePanel
          conversation={conversation}
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
}: {
  conversations: ChatConversationListItem[];
  activeConversation: ActiveConversation | null;
  teammates: ChatUser[];
}) {
  const { t } = useLocale();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.98))] shadow-[0_30px_90px_rgba(15,23,42,0.1)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(148,163,184,0.1),transparent_28%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.08),transparent_26%)]" />

      <div className="relative grid min-h-[calc(100vh-11.5rem)] xl:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="hidden min-h-0 border-r border-slate-200/80 xl:block">
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
            "absolute inset-y-0 left-0 z-30 w-[min(23rem,calc(100vw-1rem))] border-r border-slate-200/80 bg-white/95 shadow-[0_20px_80px_rgba(15,23,42,0.18)] backdrop-blur transition-transform duration-300 xl:hidden",
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
            className="absolute inset-0 z-20 bg-slate-950/35 xl:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        ) : null}

        <div className="relative min-h-0">
          {activeConversation ? (
            <div className="relative">
              <ActiveConversationPanel
                key={activeConversation.id}
                conversation={activeConversation}
                isProfileOpen={isProfileOpen}
                onOpenSidebar={() => setIsSidebarOpen(true)}
                onToggleProfile={() => setIsProfileOpen((current) => !current)}
              />
              {isProfileOpen ? (
                <button
                  type="button"
                  aria-label={t("Close details")}
                  className="absolute inset-0 z-20 bg-slate-950/30 2xl:hidden"
                  onClick={() => setIsProfileOpen(false)}
                />
              ) : null}
            </div>
          ) : (
            <div className="flex min-h-[calc(100vh-11.5rem)] items-center justify-center px-6 py-10">
              <div className="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white/88 p-8 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-[1.5rem] bg-slate-950 text-white shadow-[0_18px_40px_rgba(15,23,42,0.22)]">
                  <Sparkles className="h-7 w-7" />
                </div>
                <h2 className="mt-6 text-2xl font-semibold tracking-tight text-slate-950">
                  {conversations.length ? t("Select a conversation") : t("No conversations yet")}
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
                  {conversations.length
                    ? t("Choose a chat from the list or create a new one to start messaging your team.")
                    : teammates.length
                      ? t("Start a direct chat or create a group to keep decisions and follow-ups in one place.")
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
