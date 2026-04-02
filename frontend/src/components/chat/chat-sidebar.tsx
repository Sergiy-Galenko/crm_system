"use client";

import { useDeferredValue } from "react";
import { X } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/chat/search-bar";
import { ChatListItem } from "@/components/chat/chat-list-item";
import { useLocale } from "@/components/providers/locale-provider";
import type { ChatConversationListItem } from "./chat-types";

export function ChatSidebar({
  chats,
  activeConversationId,
  searchQuery,
  onSearchChange,
  onSelectConversation,
  newChatAction,
  onCloseMobile,
  showMobileClose = false,
}: {
  chats: ChatConversationListItem[];
  activeConversationId?: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelectConversation: () => void;
  newChatAction: React.ReactNode;
  onCloseMobile?: () => void;
  showMobileClose?: boolean;
}) {
  const { t } = useLocale();
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const filteredChats = deferredSearchQuery.trim()
    ? chats.filter((chat) =>
        [chat.title, chat.subtitle, chat.lastMessagePreview].join(" ").toLowerCase().includes(deferredSearchQuery.trim().toLowerCase()),
      )
    : chats;

  return (
    <aside className="flex h-full min-h-0 flex-col bg-[color-mix(in_srgb,var(--ui-surface-solid)_60%,transparent)] backdrop-blur-[20px]">
      <div className="border-b border-[var(--ui-border)] px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <BrandMark href="/dashboard/chat" />
          {showMobileClose ? (
            <Button type="button" variant="ghost" size="icon" onClick={onCloseMobile} aria-label={t("Close sidebar")}>
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
        <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">{t("All chats")}</p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">{t("Conversations")}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">{t("Search chats, jump between deals, and keep your team aligned.")}</p>
        <div className="mt-4">
          <SearchBar value={searchQuery} onChange={onSearchChange} placeholder={t("Search chats")} />
        </div>
        <div className="mt-4">
          <div className="[&_button]:w-full [&_button]:justify-center [&_button]:rounded-2xl [&_button]:border-transparent [&_button]:bg-[var(--ui-brand)] [&_button]:px-4 [&_button]:text-[var(--ui-brand-foreground)] [&_button]:shadow-[var(--ui-shadow-strong)] [&_button]:hover:bg-[var(--ui-brand-hover)] [&_svg]:h-4 [&_svg]:w-4">
            {newChatAction}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {filteredChats.length ? (
          filteredChats.map((conversation) => (
            <ChatListItem
              key={conversation.id}
              conversation={conversation}
              active={conversation.id === activeConversationId}
              onSelect={onSelectConversation}
            />
          ))
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-[var(--ui-border)] bg-[var(--ui-surface-solid)] px-4 py-8 text-center text-sm leading-6 text-slate-500">
            {t("No chats match this search.")}
          </div>
        )}
      </div>
    </aside>
  );
}
