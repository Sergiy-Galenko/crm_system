"use client";

import { startTransition } from "react";
import { Bell, BellOff, EllipsisVertical, Menu, Pin, Search, X } from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";
import { pinMessageAction, setConversationMuteAction } from "@/actions/chat";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChatAvatarStack } from "@/components/chat/chat-avatar-stack";
import { cn } from "@/lib/utils";
import type { ActiveConversation } from "./chat-types";

export function ChatHeader({
  conversation,
  onOpenSidebar,
  onToggleProfile,
  onToggleSearch,
  onSearchChange,
  onClearSearch,
  onJumpToLatest,
  profileOpen = false,
  searchOpen = false,
  searchQuery = "",
  searchResultCount = 0,
}: {
  conversation: ActiveConversation;
  onOpenSidebar: () => void;
  onToggleProfile: () => void;
  onToggleSearch: () => void;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onJumpToLatest: () => void;
  profileOpen?: boolean;
  searchOpen?: boolean;
  searchQuery?: string;
  searchResultCount?: number;
}) {
  const { t } = useLocale();

  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-[linear-gradient(180deg,rgba(10,15,28,0.82),rgba(10,15,28,0.58))] px-3 py-3 backdrop-blur-[26px] transition-all duration-300 sm:px-5 md:px-6">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="rounded-[1rem] border border-white/10 bg-white/[0.03] text-white/80 hover:bg-white/[0.08] hover:text-white md:hidden"
          onClick={onOpenSidebar}
          aria-label={t("All chats")}
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* ── Avatar + name: click to toggle details panel ── */}
        <button
          type="button"
          onClick={onToggleProfile}
          aria-label={profileOpen ? t("Close details") : t("Open details")}
          className={cn(
            "group flex min-w-0 flex-1 items-center gap-3 rounded-[1.2rem] px-2 py-1.5 text-left transition-colors duration-200",
            profileOpen
              ? "bg-sky-400/10 ring-1 ring-sky-400/20"
              : "hover:bg-white/[0.05]",
          )}
        >
          <ChatAvatarStack participants={conversation.participants} type={conversation.type} className="shrink-0" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className={cn(
                "truncate text-[1.2rem] font-semibold tracking-[-0.03em] transition-colors sm:text-[1.35rem]",
                profileOpen ? "text-sky-100" : "text-white group-hover:text-white",
              )}>
                {conversation.title}
              </h2>
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white/60">
                {conversation.type === "GROUP" ? t("Group") : t("Direct")}
              </span>
              {conversation.mutedUntil ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-amber-200">
                  <BellOff className="h-3.5 w-3.5" />
                  {t("Muted")}
                </span>
              ) : null}
            </div>
            <p className={cn(
              "mt-0.5 truncate text-sm leading-6 transition-colors",
              profileOpen ? "text-sky-200/70" : "text-white/62",
            )}>
              {conversation.statusLabel}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1.5 rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-1.5 shadow-[0_18px_40px_rgba(2,6,23,0.18)]">
          {/* Search toggle */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={searchOpen ? "rounded-[0.95rem] border border-sky-400/20 bg-sky-400/15 text-sky-100 hover:bg-sky-400/20 hover:text-white" : "rounded-[0.95rem] text-white/70 hover:bg-white/[0.08] hover:text-white"}
            onClick={onToggleSearch}
            aria-label={searchOpen ? t("Close search") : t("Search messages")}
          >
            <Search className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon" className="rounded-[0.95rem] text-white/70 hover:bg-white/[0.08] hover:text-white" aria-label={t("More actions")}>
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
              <DropdownMenuItem
                onSelect={() => {
                  startTransition(() => {
                    setConversationMuteAction(
                      conversation.id,
                      conversation.mutedUntil ? null : new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
                    );
                  });
                }}
              >
                {conversation.mutedUntil ? <Bell className="mr-2 h-4 w-4" /> : <BellOff className="mr-2 h-4 w-4" />}
                {conversation.mutedUntil ? t("Unmute conversation") : t("Mute notifications")}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onJumpToLatest}>{t("Jump to latest")}</DropdownMenuItem>
              <DropdownMenuItem onSelect={onToggleSearch}>
                {searchOpen ? t("Close search") : t("Search messages")}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onToggleProfile}>
                {profileOpen ? t("Hide details") : t("Show details")}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onClearSearch} disabled={!searchQuery}>
                {t("Clear search")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {searchOpen ? (
        <div className="mt-4 flex flex-col gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-3 shadow-[0_18px_36px_rgba(2,6,23,0.18)] sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={t("Type to filter this conversation")}
              autoFocus
              className="rounded-[1.1rem] border-white/10 bg-white/[0.04] pl-10 pr-10 text-white shadow-none placeholder:text-white/40"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={onClearSearch}
                aria-label={t("Clear search")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/45 transition hover:bg-white/[0.08] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <div className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/62">
            {searchQuery ? t("{count} matches", { count: searchResultCount }) : t("Search messages")}
          </div>
        </div>
      ) : null}

      {conversation.pinnedMessage ? (
        <div className="mt-3 flex items-center gap-3 rounded-[1.3rem] border border-amber-300/16 bg-[linear-gradient(135deg,rgba(251,191,36,0.12),rgba(15,23,42,0.12))] p-3 backdrop-blur-md">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[1rem] bg-amber-300/14 text-amber-200">
            <Pin className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">
              {t("Pinned Message")} <span className="ml-1 font-normal text-white/55">({conversation.pinnedMessage.senderName})</span>
            </p>
            <p className="truncate text-xs text-white/62">
              {conversation.pinnedMessage.body || t("Attachment")}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 rounded-full text-white/50 hover:bg-white/[0.08] hover:text-white"
            onClick={() => startTransition(() => pinMessageAction(conversation.id, null))}
            aria-label={t("Unpin message")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
    </header>
  );
}
