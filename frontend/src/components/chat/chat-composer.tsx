"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Check, MessageSquareQuote, Paperclip, PencilLine, SendHorizontal, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { sendMessageAction, updateMessageAction } from "@/actions/chat";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { idleActionState, type ActionResult } from "@/lib/actions";
import { cn } from "@/lib/utils";
import type { ChatMessageItem } from "./chat-types";

const supportedImageTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/gif", "image/avif"]);
const supportedVideoTypes = new Set(["video/mp4", "video/webm", "video/quicktime", "video/ogg"]);
const supportedAttachmentExtensions = [".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif", ".avif", ".mp4", ".webm", ".mov", ".ogv"];
const attachmentAccept = [...supportedImageTypes, ...supportedVideoTypes].join(",");
const maxAttachmentSizeBytes = 12 * 1024 * 1024;

type AttachmentPreview = {
  fileName: string;
  mediaType: "IMAGE" | "VIDEO";
  mediaUrl: string;
};

function isSupportedAttachment(file: File) {
  if (supportedImageTypes.has(file.type) || supportedVideoTypes.has(file.type)) {
    return true;
  }

  const lowerCaseName = file.name.toLowerCase();
  return supportedAttachmentExtensions.some((extension) => lowerCaseName.endsWith(extension));
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Invalid file result."));
        return;
      }

      resolve(reader.result);
    };

    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

function getDraftStorageKey(conversationId: string) {
  return `koru-chat-draft:${conversationId}`;
}

function getInitialMessageBody(conversationId: string, editingMessage?: ChatMessageItem | null) {
  if (editingMessage) {
    return editingMessage.body ?? "";
  }

  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(getDraftStorageKey(conversationId)) ?? "";
}

function getReplyPreview(message: ChatMessageItem, t: (key: string, values?: Record<string, string | number>) => string) {
  if (message.body) {
    return message.body;
  }

  if (message.mediaType === "IMAGE") {
    return t("Photo");
  }

  if (message.mediaType === "VIDEO") {
    return t("Video");
  }

  return t("Message");
}

export function ChatComposer({
  conversationId,
  editingMessage,
  replyToMessage,
  onCancelEdit,
  onCancelReply,
  onJumpToMessage,
  onSubmitted,
}: {
  conversationId: string;
  editingMessage?: ChatMessageItem | null;
  replyToMessage?: ChatMessageItem | null;
  onCancelEdit: () => void;
  onCancelReply: () => void;
  onJumpToMessage: (messageId: string) => void;
  onSubmitted?: () => void;
}) {
  const [state, setState] = useState<ActionResult>(idleActionState);
  const [messageBody, setMessageBody] = useState(() => getInitialMessageBody(conversationId, editingMessage));
  const [attachment, setAttachment] = useState<AttachmentPreview | null>(null);
  const [isDraggingAttachment, setIsDraggingAttachment] = useState(false);
  const [attachmentError, setAttachmentError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { t } = useLocale();

  useEffect(() => {
    if (editingMessage || typeof window === "undefined") {
      return;
    }

    const storageKey = getDraftStorageKey(conversationId);
    const nextValue = messageBody.trim();

    if (!nextValue) {
      window.localStorage.removeItem(storageKey);
      return;
    }

    window.localStorage.setItem(storageKey, messageBody);
  }, [conversationId, editingMessage, messageBody]);

  async function prepareAttachment(file: File) {
    if (!isSupportedAttachment(file)) {
      setAttachmentError(t("Upload a valid image or video file."));
      return;
    }

    if (file.size > maxAttachmentSizeBytes) {
      setAttachmentError(t("Chat attachments must be 12 MB or smaller."));
      return;
    }

    try {
      const mediaUrl = await fileToDataUrl(file);
      const mediaType = file.type.startsWith("video/") || /\.(mp4|webm|mov|ogv)$/i.test(file.name) ? "VIDEO" : "IMAGE";

      setAttachment({
        fileName: file.name,
        mediaType,
        mediaUrl,
      });
      setAttachmentError("");
    } catch {
      setAttachmentError(t("We couldn't read that image or video. Try another file."));
    }
  }

  async function handleAttachmentSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    await prepareAttachment(file);
  }

  async function handleAttachmentDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingAttachment(false);

    const file = event.dataTransfer.files?.[0];

    if (!file) {
      return;
    }

    await prepareAttachment(file);
  }

  function handleSubmit() {
    setIsSubmitting(true);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("body", messageBody);

      if (editingMessage) {
        formData.set("messageId", editingMessage.id);
      } else {
        formData.set("conversationId", conversationId);

        if (attachment?.mediaUrl) {
          formData.set("mediaUrl", attachment.mediaUrl);
          formData.set("mediaType", attachment.mediaType);
        }

        if (replyToMessage) {
          formData.set("replyToMessageId", replyToMessage.id);
        }
      }

      const nextState = editingMessage
        ? await updateMessageAction(idleActionState, formData)
        : await sendMessageAction(idleActionState, formData);

      setState(nextState);
      setIsSubmitting(false);

      if (!nextState.success) {
        return;
      }

      if (editingMessage) {
        onCancelEdit();
      } else {
        setMessageBody("");
        setAttachment(null);
        setAttachmentError("");
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(getDraftStorageKey(conversationId));
        }
      }

      onSubmitted?.();
      router.refresh();
    });
  }

  return (
    <div className="grid gap-3">
      {editingMessage ? (
        <div className="flex items-start justify-between gap-3 rounded-[1.35rem] border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] px-4 py-3 shadow-[var(--ui-shadow-xs)]">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <PencilLine className="h-4 w-4" />
              {t("Editing message")}
            </div>
            <p className="mt-1 truncate text-xs text-slate-500">{editingMessage.body}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onCancelEdit} aria-label={t("Cancel editing")}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      {!editingMessage && replyToMessage ? (
        <div className="flex items-start justify-between gap-3 rounded-[1.35rem] border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] px-4 py-3 shadow-[var(--ui-shadow-xs)]">
          <button type="button" className="min-w-0 text-left" onClick={() => onJumpToMessage(replyToMessage.id)}>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <MessageSquareQuote className="h-4 w-4" />
              {t("Replying to {name}", { name: replyToMessage.sender.name })}
            </div>
            <p className="mt-1 truncate text-xs text-slate-500">{getReplyPreview(replyToMessage, t)}</p>
          </button>
          <Button type="button" variant="ghost" size="icon" onClick={onCancelReply} aria-label={t("Cancel reply")}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      {attachment ? (
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-950">{t("Attachment ready")}</p>
              <p className="mt-1 truncate text-xs text-slate-500">{attachment.fileName}</p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => setAttachment(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-3 overflow-hidden rounded-[1.25rem] border border-slate-200 bg-slate-50">
            {attachment.mediaType === "IMAGE" ? (
              <Image
                src={attachment.mediaUrl}
                alt={t("Attachment preview")}
                width={1200}
                height={900}
                unoptimized
                className="max-h-72 w-full object-cover"
              />
            ) : (
              <video src={attachment.mediaUrl} controls className="max-h-72 w-full bg-black object-contain" />
            )}
          </div>
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept={attachmentAccept}
        className="hidden"
        onChange={(event) => {
          void handleAttachmentSelection(event);
        }}
      />

      <div
        className={cn(
          "rounded-[1.75rem] border border-slate-200 bg-white p-3 shadow-sm transition",
          isDraggingAttachment ? "border-sky-500 bg-sky-50" : "hover:border-slate-300",
          editingMessage ? "border-[var(--ui-border-strong)]" : "",
        )}
        onDragEnter={(event) => {
          if (editingMessage) {
            return;
          }

          event.preventDefault();
          setIsDraggingAttachment(true);
        }}
        onDragOver={(event) => {
          if (editingMessage) {
            return;
          }

          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
          setIsDraggingAttachment(true);
        }}
        onDragLeave={(event) => {
          if (editingMessage) {
            return;
          }

          event.preventDefault();
          setIsDraggingAttachment(false);
        }}
        onDrop={(event) => {
          if (editingMessage) {
            return;
          }

          void handleAttachmentDrop(event);
        }}
      >
        <div className="flex items-end gap-3">
          {!editingMessage ? (
            <Button type="button" variant="secondary" size="icon" className="shrink-0" onClick={() => fileInputRef.current?.click()}>
              <Paperclip className="h-4 w-4" />
            </Button>
          ) : null}

          <div className="min-w-0 flex-1">
            <Textarea
              name="body"
              value={messageBody}
              onChange={(event) => setMessageBody(event.target.value)}
              placeholder={t(editingMessage ? "Refine your message..." : "Write a message or add a caption...")}
              className="min-h-24 resize-none rounded-[1.4rem] border-0 bg-transparent px-2 py-2 shadow-none focus:border-0 focus:ring-0"
            />
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 px-2 text-xs text-slate-500">
              {editingMessage ? (
                <>
                  <span>{t("Save a cleaner version without breaking the original message order.")}</span>
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                      <LoaderIcon />
                      {t("Saving...")}
                    </span>
                  ) : null}
                </>
              ) : (
                <>
                  <span>{t("Drag and drop a photo or video here, or choose a file.")}</span>
                  <span>{t("Photos and videos up to 12 MB.")}</span>
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                      <LoaderIcon />
                      {t("Sending...")}
                    </span>
                  ) : null}
                </>
              )}
            </div>
          </div>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || (editingMessage ? !messageBody.trim() : !messageBody.trim() && !attachment)}
            className={cn("h-12 rounded-full px-4", editingMessage ? "min-w-[6.75rem]" : "w-12 p-0")}
            aria-label={t(editingMessage ? "Save" : "Send")}
          >
            {editingMessage ? (
              <>
                <Check className="h-4 w-4" />
                {t("Save")}
              </>
            ) : (
              <SendHorizontal className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {attachmentError ? <p className="text-xs font-medium text-rose-500">{attachmentError}</p> : null}
      {state.message && !state.success ? <p className="text-xs font-medium text-rose-500">{state.message}</p> : null}
      {state.fields?.body ? <p className="text-xs font-medium text-rose-500">{state.fields.body}</p> : null}
      {state.fields?.mediaUrl ? <p className="text-xs font-medium text-rose-500">{state.fields.mediaUrl}</p> : null}
    </div>
  );
}

function LoaderIcon() {
  return <span className="h-2 w-2 animate-pulse rounded-full bg-current" />;
}
