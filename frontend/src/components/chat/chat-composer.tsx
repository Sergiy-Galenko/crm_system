"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Check, MessageSquareQuote, Paperclip, PencilLine, SendHorizontal, X, BarChart2, Plus, Minus } from "lucide-react";
import { useRouter } from "next/navigation";
import { sendMessageAction, updateMessageAction } from "@/actions/chat";
import { searchMentionsAction, type SmartMentionResult } from "@/actions/search-mentions";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  const [pollDraft, setPollDraft] = useState<{ question: string; options: string[] } | null>(null);
  const [mentionQuery, setMentionQuery] = useState<{ query: string; index: number; type: string } | null>(null);
  const [mentionResults, setMentionResults] = useState<SmartMentionResult[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const { t } = useLocale();
  const canSubmit = editingMessage 
    ? Boolean(messageBody.trim()) && !isSubmitting 
    : (!isSubmitting && (Boolean(messageBody.trim()) || Boolean(attachment) || (pollDraft && pollDraft.question.trim() && pollDraft.options[0].trim())));

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

  useEffect(() => {
    const cursor = textareaRef.current?.selectionStart ?? messageBody.length;
    const textBeforeCursor = messageBody.slice(0, cursor);
    const match = textBeforeCursor.match(/(?:^|\s)([/#])([\w\sа-яієїґ]{0,20})$/i);

    if (match) {
      const type = match[1];
      const q = match[2].trim();
      setMentionQuery({ query: q, index: match.index! + match[1].length, type });
      searchMentionsAction(q).then((results) => setMentionResults(results));
    } else {
      setMentionQuery(null);
      setMentionResults([]);
    }
  }, [messageBody]);

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
    if (!canSubmit) {
      return;
    }

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

        if (pollDraft) {
          formData.set("poll_question", pollDraft.question);
          pollDraft.options.filter((opt) => opt.trim() !== "").forEach((opt) => {
             formData.append("poll_options", opt.trim());
          });
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
        setPollDraft(null);
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
        <div className="rounded-[1.5rem] border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] p-3.5 shadow-[var(--ui-shadow-xs)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--ui-text-strong)]">{t("Attachment ready")}</p>
              <p className="mt-1 truncate text-xs text-[var(--ui-text-muted)]">{attachment.fileName}</p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => setAttachment(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-3 overflow-hidden rounded-[1.25rem] border border-[var(--ui-border)] bg-[var(--ui-surface-muted)]">
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

      {pollDraft ? (
        <div className="rounded-[1.5rem] border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] p-4 shadow-[var(--ui-shadow-xs)] relative">
           <Button type="button" variant="ghost" size="icon" onClick={() => setPollDraft(null)} className="absolute right-3 top-3 w-7 h-7">
              <X className="h-4 w-4" />
           </Button>
           <h4 className="text-sm font-semibold mb-3">Create Poll</h4>
           <Input 
             placeholder={t("Ask a question...")} 
             value={pollDraft.question}
             className="mb-2 bg-transparent text-sm"
             onChange={(e) => setPollDraft({ ...pollDraft, question: e.target.value })}
             autoFocus
           />
           <div className="space-y-2 mt-3">
             {pollDraft.options.map((option, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                   <Input 
                     placeholder={t("Option {n}", { n: idx + 1 })}
                     value={option}
                     className="bg-transparent text-sm h-8"
                     onChange={(e) => {
                       const newOptions = [...pollDraft.options];
                       newOptions[idx] = e.target.value;
                       setPollDraft({ ...pollDraft, options: newOptions });
                     }}
                   />
                   {pollDraft.options.length > 2 && (
                     <Button type="button" variant="ghost" size="icon" className="w-8 h-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => {
                        const newOptions = pollDraft.options.filter((_, i) => i !== idx);
                        setPollDraft({ ...pollDraft, options: newOptions });
                     }}>
                       <Minus className="w-3.5 h-3.5" />
                     </Button>
                   )}
                </div>
             ))}
           </div>
           {pollDraft.options.length < 10 && (
              <Button type="button" variant="ghost" size="sm" className="mt-2 h-7 px-2 text-xs text-[var(--ui-brand)] hover:text-[var(--ui-brand-foreground)] hover:bg-[var(--ui-brand)]/10" onClick={() => setPollDraft({ ...pollDraft, options: [...pollDraft.options, ""] })}>
                 <Plus className="w-3.5 h-3.5 mr-1" /> Add Option
              </Button>
           )}
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
          "rounded-[2.25rem] border border-[color-mix(in_srgb,var(--ui-border)_40%,transparent)] bg-[color-mix(in_srgb,var(--ui-surface-solid)_75%,transparent)] p-3 shadow-[0_8px_30px_rgb(0_0_0/0.08)] backdrop-blur-2xl transition-all duration-300",
          isDraggingAttachment
            ? "border-[var(--ui-brand)] bg-[color-mix(in_srgb,var(--ui-brand)_10%,var(--ui-surface-solid))]"
            : "focus-within:-translate-y-1 focus-within:shadow-[0_16px_40px_rgb(0_0_0/0.12)] hover:border-[color-mix(in_srgb,var(--ui-border-strong)_80%,transparent)]",
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
            <div className="flex flex-col gap-2 shrink-0 justify-end h-full">
              {!pollDraft && (
                <Button type="button" title={t("Create Poll")} variant="ghost" size="icon" className="h-[2.75rem] w-[2.75rem] rounded-[1.35rem] text-[var(--ui-text-muted)] hover:bg-black/5 hover:text-[var(--ui-text-strong)]" onClick={() => setPollDraft({ question: "", options: ["", ""] })}>
                  <BarChart2 className="h-5 w-5" />
                </Button>
              )}
              <Button type="button" title={t("Attach File")} variant="secondary" size="icon" className="h-[2.75rem] w-[2.75rem] rounded-[1.35rem]" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="h-5 w-5" />
              </Button>
            </div>
          ) : null}

          <div className="min-w-0 flex-1 relative rounded-[1.55rem] border border-[var(--ui-border)] bg-[var(--ui-surface-solid)] p-3 shadow-[var(--ui-shadow-xs)]">
            {mentionQuery && mentionResults.length > 0 && (
              <div className="absolute bottom-full mb-2 left-0 w-[24rem] max-w-[calc(100vw-4rem)] rounded-[1.25rem] border border-[var(--ui-border)] bg-[color-mix(in_srgb,var(--ui-surface-solid)_85%,transparent)] shadow-[0_12px_40px_rgb(0_0_0/0.12)] z-50 overflow-hidden backdrop-blur-3xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 bg-[color-mix(in_srgb,var(--ui-surface-muted)_50%,transparent)] border-b border-[var(--ui-border)]">
                  Smart Mentions
                </div>
                <ul className="max-h-64 overflow-y-auto p-1.5 scrollbar-none">
                  {mentionResults.map((result) => (
                    <li key={`${result.type}-${result.id}`}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-3 rounded-[0.85rem] px-3 py-2 text-left hover:bg-[color-mix(in_srgb,var(--ui-brand)_10%,transparent)] focus:bg-[color-mix(in_srgb,var(--ui-brand)_15%,transparent)] outline-none transition-colors"
                        onClick={() => {
                          const prefix = messageBody.slice(0, mentionQuery.index - 1);
                          const suffix = messageBody.slice(textareaRef.current!.selectionStart);
                          const tagStr = `[[${result.type}:${result.id}:${result.title}]] `;
                          setMessageBody(prefix + tagStr + suffix);
                          setMentionQuery(null);
                          textareaRef.current?.focus();
                        }}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[var(--ui-text-strong)]">{result.title}</p>
                          <p className="truncate text-[11px] text-[var(--ui-text-muted)] mt-0.5">{result.subtitle}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-[var(--ui-brand)]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--ui-brand)]">
                          {result.type}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Textarea
              ref={textareaRef}
              name="body"
              value={messageBody}
              onChange={(event) => setMessageBody(event.target.value)}
              onKeyDown={(event) => {
                const nativeEvent = event.nativeEvent as KeyboardEvent & { isComposing?: boolean };

                if (event.key === "Enter" && !event.shiftKey && !nativeEvent.isComposing) {
                  event.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={t(editingMessage ? "Refine your message..." : "Write a message or add a caption...")}
              className="min-h-28 resize-none rounded-[1.3rem] border-0 bg-transparent px-1 py-1 text-[15px] shadow-none focus:border-0 focus:ring-0"
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--ui-border)] pt-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--ui-text-muted)]">
                {editingMessage ? (
                  <>
                    <span>{t("Save a cleaner version without breaking the original message order.")}</span>
                    {isSubmitting ? (
                      <span className="inline-flex items-center gap-1 font-medium text-[var(--ui-text)]">
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
                      <span className="inline-flex items-center gap-1 font-medium text-[var(--ui-text)]">
                        <LoaderIcon />
                        {t("Sending...")}
                      </span>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              "self-end rounded-[1.35rem] px-4 shadow-[var(--ui-shadow-soft)] transition-all duration-300",
              editingMessage ? "h-12 min-w-[7rem]" : "h-12 w-12 p-0",
              canSubmit && !editingMessage ? "bg-[linear-gradient(135deg,var(--ui-brand),#6366f1)] hover:scale-105 active:scale-95" : ""
            )}
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
