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
        "grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-[1.6rem] border px-4 py-3.5 transition duration-200",
        active
          ? "border-slate-900 bg-slate-950 text-white shadow-[0_24px_48px_rgba(15,23,42,0.2)]"
          : "border-transparent bg-white/80 hover:border-slate-200 hover:bg-white",
      )}
    >
      <ChatAvatarStack participants={conversation.participants} type={conversation.type} className="shrink-0" />
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{conversation.title}</p>
            <p className={cn("truncate text-xs leading-5", active ? "text-slate-300" : "text-slate-500")}>
              {conversation.subtitle}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <span className={cn("text-[11px]", active ? "text-slate-300" : "text-slate-400")}>
              {conversation.lastMessageTimeLabel}
            </span>
            {conversation.unreadCount > 0 ? (
              <span
                className={cn(
                  "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none",
                  active ? "bg-white/15 text-white" : "bg-sky-100 text-sky-700",
                )}
              >
                {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
              </span>
            ) : null}
          </div>
        </div>
        <p className={cn("mt-2 truncate text-sm", active ? "text-slate-100" : "text-slate-500")}>
          {conversation.lastMessagePreview}
        </p>
      </div>
    </Link>
  );
}
