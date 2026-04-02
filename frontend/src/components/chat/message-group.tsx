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
  onForwardMessage,
  onPinMessage,
}: {
  group: ChatMessageGroup;
  conversation: ActiveConversation;
  highlightedMessageId?: string | null;
  onEditMessage: (message: ChatMessageItem) => void;
  onJumpToMessage: (messageId: string) => void;
  onReplyToMessage: (message: ChatMessageItem) => void;
  onForwardMessage: (message: ChatMessageItem) => void;
  onPinMessage: (messageId: string) => void;
}) {
  return (
    <section className="space-y-4">
      <div className="flex justify-center">
        <span className="rounded-full border border-[var(--ui-border)] bg-[color-mix(in_srgb,var(--ui-surface-solid)_84%,transparent)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--ui-text-soft)] shadow-[var(--ui-shadow-xs)] backdrop-blur">
          {group.label}
        </span>
      </div>

      <div className="space-y-4">
        {group.items.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            mentionableUsers={conversation.participantDirectory}
            highlighted={highlightedMessageId === message.id}
            isPinned={conversation.pinnedMessage?.id === message.id}
            onEditMessage={onEditMessage}
            onJumpToMessage={onJumpToMessage}
            onReplyToMessage={onReplyToMessage}
            onForwardMessage={onForwardMessage}
            onPinMessage={onPinMessage}
            showSenderName={conversation.type === "GROUP" && !message.isCurrentUser}
          />
        ))}
      </div>
    </section>
  );
}
