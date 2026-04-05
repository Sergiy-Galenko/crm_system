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
        "group grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-[1.5rem] border px-4 py-3.5 transition-all duration-300",
        active
          ? "border-[color-mix(in_srgb,#93c5fd_30%,var(--ui-border))] bg-[linear-gradient(135deg,rgba(15,23,42,0.94),rgba(30,41,59,0.84))] text-white shadow-[0_20px_40px_rgba(2,6,23,0.24)]"
          : "border-[color-mix(in_srgb,var(--ui-border)_42%,transparent)] bg-[color-mix(in_srgb,var(--ui-surface-solid)_40%,transparent)] text-[var(--ui-text-strong)] hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,#94a3b8_36%,var(--ui-border))] hover:bg-[color-mix(in_srgb,var(--ui-surface-solid)_66%,transparent)] hover:shadow-[0_16px_34px_rgba(2,6,23,0.14)]",
      )}
    >
      <ChatAvatarStack participants={conversation.participants} type={conversation.type} className="shrink-0" />
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={cn("truncate text-sm font-semibold tracking-tight", active ? "text-white" : "text-[var(--ui-text-strong)]")}>
              {conversation.title}
            </p>
            <p className={cn("mt-0.5 truncate text-xs leading-5", active ? "text-white/65" : "text-[var(--ui-text-soft)]")}>
              {conversation.subtitle}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-medium tracking-[0.14em] uppercase",
                active
                  ? "bg-white/10 text-white/70"
                  : "bg-[color-mix(in_srgb,var(--ui-surface-muted)_80%,transparent)] text-[var(--ui-text-soft)]",
              )}
            >
              {conversation.lastMessageTimeLabel}
            </span>
            {conversation.unreadCount > 0 ? (
              <span
                className={cn(
                  "inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-1 text-[11px] font-semibold leading-none shadow-[0_10px_24px_rgba(2,6,23,0.16)]",
                  active ? "bg-sky-400/15 text-sky-100" : "bg-sky-500 text-white",
                )}
              >
                {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
              </span>
            ) : null}
          </div>
        </div>
        <p
          className={cn(
            "mt-2 truncate text-[13px]",
            active
              ? "text-white/86"
              : conversation.unreadCount > 0
                ? "font-medium text-[var(--ui-text)]"
                : "text-[var(--ui-text-muted)]",
          )}
        >
          {conversation.lastMessagePreview}
        </p>
      </div>
    </Link>
  );
}
