"use client";

import { startTransition, useState, useTransition } from "react";
import { EllipsisVertical, PencilLine, Reply, Trash, Forward, Pin } from "lucide-react";
import { useRouter } from "next/navigation";
import { toggleMessageReactionAction, deleteMessageAction, votePollAction } from "@/actions/chat";
import { ChatImageLightbox } from "@/components/chat/chat-image-lightbox";
import { ChatMessageContent } from "@/components/chat/chat-message-content";
import { ChatMessageStatus } from "@/components/chat/chat-message-status";
import { useLocale } from "@/components/providers/locale-provider";
import { UserAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ChatMessageItem } from "./chat-types";

const reactionOptions = ["👍", "❤️", "🔥", "😂", "👏", "🎯"];

export function MessageBubble({
  message,
  mentionableUsers,
  highlighted = false,
  onEditMessage,
  onJumpToMessage,
  onReplyToMessage,
  onForwardMessage,
  onPinMessage,
  showSenderName,
  isPinned,
}: {
  message: ChatMessageItem;
  mentionableUsers: Array<{ nickname?: string | null }>;
  highlighted?: boolean;
  onEditMessage: (message: ChatMessageItem) => void;
  onJumpToMessage: (messageId: string) => void;
  onReplyToMessage: (message: ChatMessageItem) => void;
  onForwardMessage: (message: ChatMessageItem) => void;
  onPinMessage: (messageId: string) => void;
  showSenderName?: boolean;
  isPinned?: boolean;
}) {
  const { t } = useLocale();
  const tone = message.isCurrentUser ? "outgoing" : "incoming";
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const [isVoting, startVoting] = useTransition();
  const router = useRouter();

  function handleOpenReactionPicker(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;

    if (target.closest("a,button,video,input,textarea,[role='menu'],[data-chat-reaction-ignore='true']")) {
      return;
    }

    setReactionPickerOpen((current) => !current);
  }

  function handleToggleReaction(emoji: string) {
    if (isReacting) {
      return;
    }

    setIsReacting(true);
    setReactionPickerOpen(false);

    startTransition(async () => {
      await toggleMessageReactionAction(message.id, emoji);
      setIsReacting(false);
      router.refresh();
    });
  }

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
          imageClassName="h-full w-full bg-transparent object-cover p-0"
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
              {message.body || message.mediaUrl ? (
                <DropdownMenuItem onSelect={() => onForwardMessage(message)}>
                  <Forward className="h-4 w-4" />
                  {t("Forward")}
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onSelect={() => onPinMessage(message.id)}>
                <Pin className="h-4 w-4 text-amber-500" />
                {t("Pin")}
              </DropdownMenuItem>
              {message.isCurrentUser && message.body ? (
                <DropdownMenuItem onSelect={() => onEditMessage(message)}>
                  <PencilLine className="h-4 w-4" />
                  {t("Edit")}
                </DropdownMenuItem>
              ) : null}
              {message.isCurrentUser ? (
                <DropdownMenuItem
                  className="text-red-500 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950/50 dark:focus:text-red-400"
                  onSelect={(e) => {
                    if (window.confirm(t("Are you sure you want to delete this message?"))) {
                      startTransition(async () => {
                        await deleteMessageAction(message.id);
                        router.refresh();
                      });
                    } else {
                      e.preventDefault();
                    }
                  }}
                >
                  <Trash className="h-4 w-4" />
                  {t("Delete")}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div
          onClick={handleOpenReactionPicker}
          className={cn(
            "cursor-pointer space-y-3 px-4 py-3 text-[15px] leading-relaxed transition-all duration-300",
            highlighted ? "ring-2 ring-[var(--ui-ring)] ring-offset-4 ring-offset-transparent scale-[1.02]" : "hover:shadow-[0_4px_20px_rgb(0_0_0/0.08)]",
            message.isCurrentUser
              ? "rounded-[1.75rem] rounded-tr-[0.5rem] bg-[linear-gradient(135deg,#2563eb,#0f766e)] text-white shadow-[0_14px_32px_rgba(37,99,235,0.22)]"
              : "rounded-[1.75rem] rounded-tl-[0.5rem] border border-[color-mix(in_srgb,var(--ui-border)_40%,transparent)] bg-[color-mix(in_srgb,var(--ui-surface-solid)_80%,transparent)] text-[var(--ui-text-strong)] shadow-[0_4px_14px_0_rgb(0_0_0/0.05)] backdrop-blur-xl",
          )}
        >
          {message.isForwarded ? (
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide opacity-70">
              <Forward className="h-3 w-3" />
              {t("Forwarded")}
            </div>
          ) : null}
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

          {message.body ? <ChatMessageContent body={message.body} tone={tone} mentionableUsers={mentionableUsers} /> : null}

          {message.poll ? (
            <div className={cn("mt-4 space-y-3 p-1 rounded-xl bg-black/5", message.isCurrentUser ? "bg-black/10 text-white" : "")}>
              <p className="font-semibold text-sm mx-1">{message.poll.question}</p>
              <div className="space-y-1.5">
                {message.poll.options.map((option) => {
                  const totalVotes = message.poll!.options.reduce((acc, o) => acc + o.voteCount, 0);
                  const percentage = totalVotes === 0 ? 0 : Math.round((option.voteCount / totalVotes) * 100);
                  const bgClass = option.hasVoted 
                    ? (message.isCurrentUser ? "bg-[var(--ui-brand-foreground)]/30" : "bg-[var(--ui-brand)]/20")
                    : (message.isCurrentUser ? "bg-transparent" : "bg-slate-100");
                  
                  return (
                    <button
                      key={option.id}
                      onClick={() => {
                        if (isVoting) return;
                        startVoting(async () => {
                          await votePollAction(message.poll!.id, option.id);
                        });
                      }}
                      className={cn(
                        "relative flex w-full items-center justify-between overflow-hidden rounded-xl border p-2.5 text-left text-sm transition-all duration-300",
                        option.hasVoted ? "border-[var(--ui-brand)]/40 font-bold" : "border-transparent bg-white/40 shadow-sm hover:bg-white/60",
                        message.isCurrentUser && !option.hasVoted ? "border-transparent bg-black/10 hover:bg-black/20" : ""
                      )}
                    >
                      <div className={cn("absolute inset-y-0 left-0 transition-all duration-500", bgClass)} style={{ width: `${percentage}%` }} />
                      <span className="relative z-10 px-1">{option.text}</span>
                      <span className="relative z-10 text-xs font-bold tabular-nums opacity-60 px-1">
                        {percentage}%
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="text-[10px] uppercase font-bold tracking-wider opacity-50 px-1">
                {message.poll.options.reduce((acc, o) => acc + o.voteCount, 0)} votes
              </div>
            </div>
          ) : null}
        </div>

        {reactionPickerOpen ? (
          <div className={cn("flex flex-wrap gap-2", message.isCurrentUser ? "justify-end" : "justify-start")}>
            {reactionOptions.map((emoji) => {
              const activeReaction = message.reactions.find((reaction) => reaction.emoji === emoji)?.reacted;

              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleToggleReaction(emoji)}
                  disabled={isReacting}
                  className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-full border text-base transition",
                    activeReaction
                      ? "border-transparent bg-[var(--ui-brand)] text-[var(--ui-brand-foreground)] shadow-[var(--ui-shadow-xs)]"
                      : "border-[var(--ui-border)] bg-[var(--ui-surface-solid)] hover:border-[var(--ui-border-strong)] hover:bg-[var(--ui-surface-hover)]",
                  )}
                  aria-label={`${t("React with {emoji}", { emoji })}`}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
        ) : null}

        {message.reactions.length ? (
          <div className={cn("flex flex-wrap items-center gap-2", message.isCurrentUser ? "justify-end" : "justify-start")}>
            {message.reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                type="button"
                onClick={() => handleToggleReaction(reaction.emoji)}
                disabled={isReacting}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition",
                  reaction.reacted
                    ? "border-transparent bg-[var(--ui-brand)] text-[var(--ui-brand-foreground)] shadow-[var(--ui-shadow-xs)]"
                    : "border-[var(--ui-border)] bg-[var(--ui-surface-solid)] text-[var(--ui-text-muted)] hover:bg-[var(--ui-surface-hover)]",
                )}
              >
                <span>{reaction.emoji}</span>
                <span>{reaction.count}</span>
              </button>
            ))}
          </div>
        ) : null}

        <div className={cn("flex items-center gap-2 text-xs", message.isCurrentUser ? "justify-end" : "justify-start")}>
          {isPinned ? <span className="font-medium text-amber-500 mr-1">{t("Pinned")}</span> : null}
          {message.isEdited ? <span className="text-slate-400">{t("Edited")}</span> : null}
          {message.isCurrentUser ? <ChatMessageStatus status={message.status} /> : null}
        </div>
      </div>
    </div>
  );
}
