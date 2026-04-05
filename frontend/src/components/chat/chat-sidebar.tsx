"use client";

import { useDeferredValue } from "react";
import { X } from "lucide-react";

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
    <aside className="flex h-full min-h-0 flex-col bg-[linear-gradient(180deg,rgba(10,15,28,0.94),rgba(15,23,42,0.84))] text-[var(--ui-text)] backdrop-blur-[26px]">
      <div className="border-b border-white/10 px-4 py-4 xl:px-5 xl:py-5">
        {showMobileClose ? (
          <div className="mb-3 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-[1rem] border border-white/10 bg-white/[0.03] text-white/80 hover:bg-white/[0.08] hover:text-white"
              onClick={onCloseMobile}
              aria-label={t("Close sidebar")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : null}

        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/45">{t("All chats")}</p>
            <h2 className="mt-1.5 text-[1.35rem] font-semibold tracking-[-0.03em] text-white xl:mt-2 xl:text-[1.55rem]">{t("Conversations")}</h2>
            {/* Only show the long descriptor when there is enough horizontal space */}
            <p className="mt-1.5 hidden max-w-xs text-sm leading-6 text-white/62 xl:block">
              {t("Search chats, jump between deals, and keep your team aligned.")}
            </p>
          </div>
          <div className="shrink-0 rounded-[1.3rem] border border-white/10 bg-white/[0.04] px-3 py-2 text-right shadow-[0_16px_32px_rgba(2,6,23,0.18)]">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">{t("Visible")}</p>
            <p className="mt-1 text-lg font-semibold tracking-tight text-white">{filteredChats.length}</p>
          </div>
        </div>

        <div className="mt-3 xl:mt-4">
          <SearchBar value={searchQuery} onChange={onSearchChange} placeholder={t("Search chats")} />
        </div>
        <div className="mt-3 xl:mt-4">
          <div className="[&_button]:h-11 [&_button]:w-full [&_button]:justify-center [&_button]:rounded-[1.2rem] [&_button]:border-transparent [&_button]:bg-[linear-gradient(135deg,#2563eb,#0f766e)] [&_button]:px-4 [&_button]:text-white [&_button]:shadow-[0_20px_40px_rgba(14,116,144,0.28)] [&_button]:hover:opacity-95 [&_svg]:h-4 [&_svg]:w-4">
            {newChatAction}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3 py-4">
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
          <div className="rounded-[1.6rem] border border-dashed border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm leading-6 text-white/58">
            {t("No chats match this search.")}
          </div>
        )}
      </div>
    </aside>
  );
}
