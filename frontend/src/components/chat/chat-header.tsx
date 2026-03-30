"use client";

import { EllipsisVertical, Menu, PanelRightOpen, Search, X } from "lucide-react";
import { useLocale } from "@/components/providers/locale-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChatAvatarStack } from "@/components/chat/chat-avatar-stack";
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
    <header className="sticky top-0 z-10 border-b border-[var(--ui-border)] bg-[var(--ui-surface-solid)] px-5 py-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" size="icon" className="xl:hidden" onClick={onOpenSidebar} aria-label={t("All chats")}>
          <Menu className="h-4 w-4" />
        </Button>

        <ChatAvatarStack participants={conversation.participants} type={conversation.type} className="shrink-0" />

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-semibold tracking-tight text-slate-950">{conversation.title}</h2>
          <p className="truncate text-sm leading-6 text-slate-500">{conversation.statusLabel}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className={searchOpen ? "rounded-2xl border-transparent bg-[var(--ui-brand)] text-[var(--ui-brand-foreground)] shadow-[var(--ui-shadow-xs)] hover:bg-[var(--ui-brand-hover)]" : "rounded-2xl shadow-[var(--ui-shadow-xs)]"}
            onClick={onToggleSearch}
            aria-label={searchOpen ? t("Close search") : t("Search messages")}
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className={profileOpen ? "rounded-2xl border-transparent bg-[var(--ui-brand)] text-[var(--ui-brand-foreground)] shadow-[var(--ui-shadow-xs)] hover:bg-[var(--ui-brand-hover)]" : "rounded-2xl shadow-[var(--ui-shadow-xs)]"}
            onClick={onToggleProfile}
            aria-label={profileOpen ? t("Close details") : t("Open details")}
          >
            <PanelRightOpen className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="secondary" size="icon" className="rounded-2xl shadow-sm" aria-label={t("More actions")}>
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
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
        <div className="mt-4 flex flex-col gap-3 rounded-[1.5rem] border border-[var(--ui-border)] bg-[var(--ui-surface-muted)] p-3 shadow-[var(--ui-shadow-xs)] sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ui-text-soft)]" />
            <Input
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={t("Type to filter this conversation")}
              autoFocus
              className="rounded-2xl border-[var(--ui-border)] bg-[var(--ui-surface-solid)] pl-10 pr-10 shadow-none"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={onClearSearch}
                aria-label={t("Clear search")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--ui-text-soft)] transition hover:bg-[var(--ui-surface-muted)] hover:text-[var(--ui-text)]"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <div className="shrink-0 text-xs font-medium text-slate-500">
            {searchQuery ? t("{count} matches", { count: searchResultCount }) : t("Search messages")}
          </div>
        </div>
      ) : null}
    </header>
  );
}
