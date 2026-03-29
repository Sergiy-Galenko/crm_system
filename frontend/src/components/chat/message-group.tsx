import { MessageBubble } from "@/components/chat/message-bubble";
import type { ActiveConversation, ChatMessageGroup } from "./chat-types";

export function MessageGroup({
  group,
  conversation,
}: {
  group: ChatMessageGroup;
  conversation: ActiveConversation;
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
            showSenderName={conversation.type === "GROUP" && !message.isCurrentUser}
          />
        ))}
      </div>
    </section>
  );
}
