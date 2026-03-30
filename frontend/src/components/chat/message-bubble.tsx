"use client";

import { EllipsisVertical, PencilLine, Reply } from "lucide-react";
import { ChatImageLightbox } from "@/components/chat/chat-image-lightbox";
import { ChatMessageContent } from "@/components/chat/chat-message-content";
import { ChatMessageStatus } from "@/components/chat/chat-message-status";
import { useLocale } from "@/components/providers/locale-provider";
import { UserAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ChatMessageItem } from "./chat-types";

export function MessageBubble({
  message,
  highlighted = false,
  onEditMessage,
  onJumpToMessage,
  onReplyToMessage,
  showSenderName,
}: {
  message: ChatMessageItem;
  highlighted?: boolean;
  onEditMessage: (message: ChatMessageItem) => void;
  onJumpToMessage: (messageId: string) => void;
  onReplyToMessage: (message: ChatMessageItem) => void;
  showSenderName?: boolean;
}) {
  const { t } = useLocale();
  const tone = message.isCurrentUser ? "outgoing" : "incoming";

  return (
    <div
      id={`chat-message-${message.id}`}
      className={cn("group flex scroll-mt-28 gap-3 transition", message.isCurrentUser ? "justify-end" : "justify-start")}
    >
      {!message.isCurrentUser ? (
        <UserAvatar
          name={message.sender.name}
          color={message.sender.avatarColor}
          imageUrl={message.sender.companyLogoUrl}
          className="mt-7 h-10 w-10 shrink-0 rounded-[1.15rem] shadow-sm"
        />
      ) : null}

      <div className={cn("max-w-[min(100%,42rem)] space-y-1", message.isCurrentUser ? "text-right" : "")}>
        <div className={cn("flex items-center gap-2", message.isCurrentUser ? "justify-end" : "justify-start")}>
          <p className="text-xs text-slate-500">
            {showSenderName ? <span className="font-medium text-slate-700">{message.sender.name} • </span> : null}
            {message.timeLabel}
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                aria-label={t("Message actions")}
              >
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={message.isCurrentUser ? "end" : "start"} className="w-48 rounded-2xl p-2">
              <DropdownMenuItem onSelect={() => onReplyToMessage(message)}>
                <Reply className="h-4 w-4" />
                {t("Reply")}
              </DropdownMenuItem>
              {message.isCurrentUser && message.body ? (
                <DropdownMenuItem onSelect={() => onEditMessage(message)}>
                  <PencilLine className="h-4 w-4" />
                  {t("Edit")}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div
          className={cn(
            "space-y-3 rounded-[1.75rem] px-3 py-3 text-sm leading-6 shadow-sm",
            highlighted ? "ring-2 ring-[var(--ui-ring)] ring-offset-2 ring-offset-transparent" : "",
            message.isCurrentUser
              ? "bg-[var(--ui-brand)] text-[var(--ui-brand-foreground)] shadow-[var(--ui-shadow-strong)]"
              : "border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] text-[var(--ui-text-strong)] shadow-[var(--ui-shadow-xs)]",
          )}
        >
          {message.replyTo ? (
            <button
              type="button"
              onClick={() => onJumpToMessage(message.replyTo!.id)}
              className={cn(
                "block w-full rounded-[1.1rem] border px-3 py-2 text-left transition",
                message.isCurrentUser
                  ? "border-white/15 bg-black/10 hover:bg-black/15"
                  : "border-[var(--ui-border)] bg-[var(--ui-surface-muted)] hover:bg-[var(--ui-surface-hover)]",
              )}
            >
              <p className={cn("text-xs font-semibold", message.isCurrentUser ? "text-[var(--ui-brand-foreground)]/85" : "text-slate-700")}>
                {message.replyTo.senderName}
              </p>
              <p className={cn("mt-1 line-clamp-2 text-xs leading-5", message.isCurrentUser ? "text-[var(--ui-brand-foreground)]/70" : "text-slate-500")}>
                {message.replyTo.preview}
              </p>
            </button>
          ) : null}

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

          {message.body ? <ChatMessageContent body={message.body} tone={tone} /> : null}
        </div>

        <div className={cn("flex items-center gap-2 text-xs", message.isCurrentUser ? "justify-end" : "justify-start")}>
          {message.isEdited ? <span className="text-slate-400">{t("Edited")}</span> : null}
          {message.isCurrentUser ? <ChatMessageStatus status={message.status} /> : null}
        </div>
      </div>
    </div>
  );
}
