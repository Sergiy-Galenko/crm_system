"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChatAvatarStack } from "@/components/chat/chat-avatar-stack";
import type { ChatConversationListItem } from "./chat-types";

export function ChatListItem({
  conversation,
  active,
  onSelect,
}: {
  conversation: ChatConversationListItem;
  active: boolean;
  onSelect?: () => void;
}) {
  return (
    <Link
      href={conversation.href as never}
      onClick={onSelect}
      className={cn(
        "grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-[1.25rem] border px-4 py-3.5 transition-all duration-300",
        active
          ? "border-[color-mix(in_srgb,var(--ui-brand)_40%,transparent)] bg-[linear-gradient(120deg,color-mix(in_srgb,var(--ui-brand)_15%,transparent),transparent)] text-[var(--ui-brand-foreground)] shadow-sm backdrop-blur-md"
          : "border-transparent bg-transparent text-slate-900 dark:text-slate-100 hover:border-[color-mix(in_srgb,var(--ui-border)_80%,transparent)] hover:bg-[color-mix(in_srgb,var(--ui-surface-hover)_40%,transparent)] hover:shadow-sm hover:backdrop-blur-sm",
      )}
    >
      <ChatAvatarStack participants={conversation.participants} type={conversation.type} className="shrink-0" />
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={cn("truncate text-sm font-semibold", active ? "text-[var(--ui-brand-foreground)]" : "text-slate-900 dark:text-white")}>
              {conversation.title}
            </p>
            <p className={cn("truncate text-xs leading-5 mt-0.5", active ? "text-[var(--ui-brand-foreground)] opacity-70" : "text-slate-500 dark:text-slate-400")}>
              {conversation.subtitle}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <span className={cn("text-[11px]", active ? "text-[var(--ui-brand-foreground)] opacity-70" : "text-slate-400 dark:text-slate-500")}>
              {conversation.lastMessageTimeLabel}
            </span>
            {conversation.unreadCount > 0 ? (
              <span
                className={cn(
                  "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none",
                  active ? "bg-black/10 text-current" : "bg-[var(--ui-brand)]/15 text-[var(--ui-brand)]",
                )}
              >
                {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
              </span>
            ) : null}
          </div>
        </div>
        <p className={cn("mt-2 truncate text-[13px]", active ? "text-[var(--ui-brand-foreground)] opacity-85" : "text-slate-500 dark:text-slate-300 font-medium")}>
          {conversation.lastMessagePreview}
        </p>
      </div>
    </Link>
  );
}
