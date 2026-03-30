"use client";

import { MessageBubble } from "@/components/chat/message-bubble";
import type { ActiveConversation, ChatMessageGroup, ChatMessageItem } from "./chat-types";

export function MessageGroup({
  group,
  conversation,
  highlightedMessageId,
  onEditMessage,
  onJumpToMessage,
  onReplyToMessage,
}: {
  group: ChatMessageGroup;
  conversation: ActiveConversation;
  highlightedMessageId?: string | null;
  onEditMessage: (message: ChatMessageItem) => void;
  onJumpToMessage: (messageId: string) => void;
  onReplyToMessage: (message: ChatMessageItem) => void;
}) {
  return (
    <section className="space-y-4">
      <div className="flex justify-center">
        <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400 shadow-sm backdrop-blur">
          {group.label}
        </span>
      </div>

      <div className="space-y-4">
        {group.items.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            highlighted={highlightedMessageId === message.id}
            onEditMessage={onEditMessage}
            onJumpToMessage={onJumpToMessage}
            onReplyToMessage={onReplyToMessage}
            showSenderName={conversation.type === "GROUP" && !message.isCurrentUser}
          />
        ))}
      </div>
    </section>
  );
}
