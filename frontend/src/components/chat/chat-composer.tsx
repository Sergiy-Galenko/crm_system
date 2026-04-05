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

type MentionQuery = {
  query: string;
  index: number;
  type: "/" | "#";
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

function getMentionQuery(messageBody: string, cursorPosition: number): MentionQuery | null {
  const textBeforeCursor = messageBody.slice(0, cursorPosition);
  const match = textBeforeCursor.match(/(?:^|\s)([/#])([\w\sа-яієїґ]{0,20})$/i);

  if (!match) {
    return null;
  }

  const type = match[1];

  if (type !== "/" && type !== "#") {
    return null;
  }

  return {
    query: match[2].trim(),
    index: (match.index ?? 0) + type.length,
    type,
  };
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
  const [cursorPosition, setCursorPosition] = useState(messageBody.length);
  const [mentionResults, setMentionResults] = useState<{ query: string; results: SmartMentionResult[] }>({
    query: "",
    results: [],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const { t } = useLocale();
  const mentionQuery = getMentionQuery(messageBody, cursorPosition);
  const mentionSearchQuery = mentionQuery?.query ?? null;
  const visibleMentionResults =
    mentionSearchQuery && mentionResults.query === mentionSearchQuery ? mentionResults.results : [];
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
    if (!mentionSearchQuery) {
      return;
    }

    let cancelled = false;

    void searchMentionsAction(mentionSearchQuery).then((results) => {
      if (!cancelled) {
        setMentionResults({ query: mentionSearchQuery, results });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [mentionSearchQuery]);

  function syncCursorPosition(target: HTMLTextAreaElement) {
    setCursorPosition(target.selectionStart ?? target.value.length);
  }

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
        <div className="flex items-start justify-between gap-3 rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-3 text-white shadow-[0_16px_34px_rgba(2,6,23,0.18)] backdrop-blur-xl">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <PencilLine className="h-4 w-4" />
              {t("Editing message")}
            </div>
            <p className="mt-1 truncate text-xs text-white/58">{editingMessage.body}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" className="text-white/65 hover:bg-white/[0.08] hover:text-white" onClick={onCancelEdit} aria-label={t("Cancel editing")}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      {!editingMessage && replyToMessage ? (
        <div className="flex items-start justify-between gap-3 rounded-[1.35rem] border border-white/10 bg-white/[0.05] px-4 py-3 text-white shadow-[0_16px_34px_rgba(2,6,23,0.18)] backdrop-blur-xl">
          <button type="button" className="min-w-0 text-left" onClick={() => onJumpToMessage(replyToMessage.id)}>
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <MessageSquareQuote className="h-4 w-4" />
              {t("Replying to {name}", { name: replyToMessage.sender.name })}
            </div>
            <p className="mt-1 truncate text-xs text-white/58">{getReplyPreview(replyToMessage, t)}</p>
          </button>
          <Button type="button" variant="ghost" size="icon" className="text-white/65 hover:bg-white/[0.08] hover:text-white" onClick={onCancelReply} aria-label={t("Cancel reply")}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      {attachment ? (
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-3.5 shadow-[0_16px_34px_rgba(2,6,23,0.18)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">{t("Attachment ready")}</p>
              <p className="mt-1 truncate text-xs text-white/58">{attachment.fileName}</p>
            </div>
            <Button type="button" variant="ghost" size="icon" className="text-white/65 hover:bg-white/[0.08] hover:text-white" onClick={() => setAttachment(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-3 overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/20">
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
        <div className="relative rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4 shadow-[0_16px_34px_rgba(2,6,23,0.18)] backdrop-blur-xl">
           <Button type="button" variant="ghost" size="icon" onClick={() => setPollDraft(null)} className="absolute right-3 top-3 h-7 w-7 text-white/65 hover:bg-white/[0.08] hover:text-white">
              <X className="h-4 w-4" />
           </Button>
           <h4 className="mb-3 text-sm font-semibold text-white">{t("Create Poll")}</h4>
           <Input 
             placeholder={t("Ask a question...")} 
             value={pollDraft.question}
             className="mb-2 border-white/10 bg-white/[0.04] text-sm text-white placeholder:text-white/40"
             onChange={(e) => setPollDraft({ ...pollDraft, question: e.target.value })}
             autoFocus
           />
           <div className="space-y-2 mt-3">
             {pollDraft.options.map((option, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                   <Input 
                     placeholder={t("Option {n}", { n: idx + 1 })}
                     value={option}
                     className="h-9 border-white/10 bg-white/[0.04] text-sm text-white placeholder:text-white/40"
                     onChange={(e) => {
                       const newOptions = [...pollDraft.options];
                       newOptions[idx] = e.target.value;
                       setPollDraft({ ...pollDraft, options: newOptions });
                     }}
                   />
                   {pollDraft.options.length > 2 && (
                     <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-rose-300 hover:bg-rose-400/10 hover:text-rose-200" onClick={() => {
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
              <Button type="button" variant="ghost" size="sm" className="mt-2 h-8 px-2 text-xs text-sky-200 hover:bg-sky-400/10 hover:text-white" onClick={() => setPollDraft({ ...pollDraft, options: [...pollDraft.options, ""] })}>
                 <Plus className="mr-1 h-3.5 w-3.5" /> {t("Add Option")}
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
          "rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,15,28,0.88),rgba(15,23,42,0.72))] p-3.5 shadow-[0_24px_56px_rgba(2,6,23,0.32)] backdrop-blur-2xl transition-all duration-300",
          isDraggingAttachment
            ? "border-sky-300/40 bg-[linear-gradient(180deg,rgba(14,165,233,0.12),rgba(15,23,42,0.84))]"
            : "focus-within:-translate-y-0.5 focus-within:shadow-[0_30px_70px_rgba(2,6,23,0.38)] hover:border-white/20",
          editingMessage ? "border-white/16" : "",
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
        <div className="grid gap-3">
          <div className="relative rounded-[1.45rem] border border-white/10 bg-black/15 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            {mentionQuery && visibleMentionResults.length > 0 && (
              <div className="absolute bottom-full left-0 z-50 mb-2 w-[24rem] max-w-[calc(100vw-4rem)] overflow-hidden rounded-[1.25rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,15,28,0.95),rgba(15,23,42,0.9))] shadow-[0_20px_44px_rgba(2,6,23,0.36)] backdrop-blur-3xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="border-b border-white/10 bg-white/[0.03] px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-widest text-white/40">
                  Smart Mentions
                </div>
                <ul className="max-h-64 overflow-y-auto p-1.5 scrollbar-none">
                  {visibleMentionResults.map((result) => (
                    <li key={`${result.type}-${result.id}`}>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-3 rounded-[0.95rem] px-3 py-2 text-left outline-none transition-colors hover:bg-white/[0.06] focus:bg-white/[0.08]"
                        onClick={() => {
                          const selectionStart = textareaRef.current?.selectionStart ?? messageBody.length;
                          const prefix = messageBody.slice(0, mentionQuery.index - 1);
                          const suffix = messageBody.slice(selectionStart);
                          const tagStr = `[[${result.type}:${result.id}:${result.title}]] `;
                          const nextBody = prefix + tagStr + suffix;
                          const nextCursorPosition = prefix.length + tagStr.length;

                          setMessageBody(nextBody);
                          setCursorPosition(nextCursorPosition);
                          requestAnimationFrame(() => {
                            textareaRef.current?.focus();
                            textareaRef.current?.setSelectionRange(nextCursorPosition, nextCursorPosition);
                          });
                        }}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-white">{result.title}</p>
                          <p className="mt-0.5 truncate text-[11px] text-white/52">{result.subtitle}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-sky-400/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-100">
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
              onChange={(event) => {
                setMessageBody(event.target.value);
                syncCursorPosition(event.target);
              }}
              onClick={(event) => syncCursorPosition(event.currentTarget)}
              onKeyUp={(event) => syncCursorPosition(event.currentTarget)}
              onSelect={(event) => syncCursorPosition(event.currentTarget)}
              onKeyDown={(event) => {
                const nativeEvent = event.nativeEvent as KeyboardEvent & { isComposing?: boolean };

                if (event.key === "Enter" && !event.shiftKey && !nativeEvent.isComposing) {
                  event.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={t(editingMessage ? "Refine your message..." : "Write a message or add a caption...")}
              className="min-h-[6.5rem] resize-none rounded-[1.2rem] border-0 bg-transparent px-1 py-1 text-[15px] text-white shadow-none placeholder:text-white/40 focus:border-0 focus:ring-0"
            />

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/10 pt-3">
              {!editingMessage ? (
                <>
                  {!pollDraft ? (
                    <Button
                      type="button"
                      title={t("Create Poll")}
                      variant="ghost"
                      size="sm"
                      className="h-9 rounded-[1rem] border border-white/10 bg-white/[0.04] px-3 text-white/72 hover:bg-white/[0.08] hover:text-white"
                      onClick={() => setPollDraft({ question: "", options: ["", ""] })}
                    >
                      <BarChart2 className="h-4 w-4" />
                      {t("Create Poll")}
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    title={t("Attach File")}
                    variant="ghost"
                    size="sm"
                    className="h-9 rounded-[1rem] border border-white/10 bg-white/[0.04] px-3 text-white/72 hover:bg-white/[0.08] hover:text-white"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-4 w-4" />
                    {t("Attach File")}
                  </Button>
                </>
              ) : null}

              <div className="min-w-0 flex-1 text-xs text-white/52">
                {editingMessage ? (
                  <>
                    <span>{t("Save a cleaner version without breaking the original message order.")}</span>
                    {isSubmitting ? (
                      <span className="ml-3 inline-flex items-center gap-1 font-medium text-white">
                        <LoaderIcon />
                        {t("Saving...")}
                      </span>
                    ) : null}
                  </>
                ) : (
                  <>
                    <span>{t("Drag and drop a photo or video here, or choose a file.")}</span>
                    <span className="ml-3">{t("Photos and videos up to 12 MB.")}</span>
                    {isSubmitting ? (
                      <span className="ml-3 inline-flex items-center gap-1 font-medium text-white">
                        <LoaderIcon />
                        {t("Sending...")}
                      </span>
                    ) : null}
                  </>
                )}
              </div>

              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={cn(
                  "h-11 min-w-[7rem] rounded-[1rem] px-4 text-white shadow-[0_18px_36px_rgba(14,116,144,0.26)] transition-all duration-300",
                  editingMessage
                    ? "bg-[linear-gradient(135deg,#2563eb,#0f766e)] hover:opacity-95"
                    : canSubmit
                      ? "bg-[linear-gradient(135deg,#2563eb,#0f766e)] hover:-translate-y-0.5 hover:shadow-[0_24px_48px_rgba(37,99,235,0.3)]"
                      : "bg-white/10 text-white/40 shadow-none",
                )}
                aria-label={t(editingMessage ? "Save" : "Send")}
              >
                {editingMessage ? (
                  <>
                    <Check className="h-4 w-4" />
                    {t("Save")}
                  </>
                ) : (
                  <>
                    <SendHorizontal className="h-4 w-4" />
                    {t("Send")}
                  </>
                )}
              </Button>
            </div>
          </div>
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
