import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/avatar";
import { ChatImageLightbox } from "@/components/chat/chat-image-lightbox";
import type { ChatMessageItem } from "./chat-types";

export function MessageBubble({
  message,
  showSenderName,
}: {
  message: ChatMessageItem;
  showSenderName?: boolean;
}) {
  return (
    <div className={cn("flex gap-3", message.isCurrentUser ? "justify-end" : "justify-start")}>
      {!message.isCurrentUser ? (
        <UserAvatar
          name={message.sender.name}
          color={message.sender.avatarColor}
          imageUrl={message.sender.companyLogoUrl}
          className="mt-7 h-10 w-10 shrink-0 rounded-[1.15rem] shadow-sm"
        />
      ) : null}

      <div className={cn("max-w-[min(100%,42rem)] space-y-1", message.isCurrentUser ? "text-right" : "")}>
        <p className="text-xs text-slate-500">
          {showSenderName ? <span className="font-medium text-slate-700">{message.sender.name} • </span> : null}
          {message.timeLabel}
        </p>

        <div
          className={cn(
            "space-y-3 rounded-[1.75rem] px-3 py-3 text-sm leading-6 shadow-sm",
            message.isCurrentUser
              ? "bg-slate-950 text-white shadow-[0_20px_40px_rgba(15,23,42,0.18)]"
              : "border border-slate-200 bg-white text-slate-900",
          )}
        >
          {message.mediaUrl && message.mediaType === "IMAGE" ? (
            <ChatImageLightbox
              src={message.mediaUrl}
              alt={message.body || "Chat attachment"}
              imageClassName="max-h-[26rem]"
            />
          ) : null}

          {message.mediaUrl && message.mediaType === "VIDEO" ? (
            <div className="overflow-hidden rounded-[1.25rem] border border-black/5 bg-black">
              <video src={message.mediaUrl} controls className="max-h-[26rem] w-full object-contain" />
            </div>
          ) : null}

          {message.body ? <p className="whitespace-pre-wrap break-words px-1">{message.body}</p> : null}
        </div>
      </div>
    </div>
  );
}
