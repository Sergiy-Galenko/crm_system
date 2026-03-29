"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Paperclip, SendHorizontal, X } from "lucide-react";
import { sendMessageAction } from "@/actions/chat";
import { SubmitButton } from "@/components/form/submit-button";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { idleActionState, type ActionResult } from "@/lib/actions";
import { cn } from "@/lib/utils";

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

export function ChatComposer({ conversationId }: { conversationId: string }) {
  const [state, setState] = useState<ActionResult>(idleActionState);
  const [attachment, setAttachment] = useState<AttachmentPreview | null>(null);
  const [isDraggingAttachment, setIsDraggingAttachment] = useState(false);
  const [attachmentError, setAttachmentError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { t } = useLocale();

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

  async function handleSendMessage(formData: FormData) {
    const nextState = await sendMessageAction(idleActionState, formData);
    setState(nextState);

    if (!nextState.success) {
      return;
    }

    formRef.current?.reset();
    setAttachment(null);
    setAttachmentError("");
    router.refresh();
  }

  return (
    <form ref={formRef} action={handleSendMessage} className="grid gap-3">
      <input type="hidden" name="conversationId" value={conversationId} />
      <input type="hidden" name="mediaUrl" value={attachment?.mediaUrl ?? ""} />
      <input type="hidden" name="mediaType" value={attachment?.mediaType ?? ""} />
      <input
        ref={fileInputRef}
        type="file"
        accept={attachmentAccept}
        className="hidden"
        onChange={(event) => {
          void handleAttachmentSelection(event);
        }}
      />

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

      <div
        className={cn(
          "rounded-[1.75rem] border border-slate-200 bg-white p-3 shadow-sm transition",
          isDraggingAttachment ? "border-sky-500 bg-sky-50" : "hover:border-slate-300",
        )}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDraggingAttachment(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
          setIsDraggingAttachment(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDraggingAttachment(false);
        }}
        onDrop={(event) => {
          void handleAttachmentDrop(event);
        }}
      >
        <div className="flex items-end gap-3">
          <Button type="button" variant="secondary" size="icon" className="shrink-0" onClick={() => fileInputRef.current?.click()}>
            <Paperclip className="h-4 w-4" />
          </Button>

          <div className="min-w-0 flex-1">
            <Textarea
              name="body"
              placeholder={t("Write a message or add a caption...")}
              className="min-h-24 resize-none rounded-[1.4rem] border-0 bg-transparent px-2 py-2 shadow-none focus:border-0 focus:ring-0"
            />
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 px-2 text-xs text-slate-500">
              <span>{t("Drag and drop a photo or video here, or choose a file.")}</span>
              <span>{t("Photos and videos up to 12 MB.")}</span>
            </div>
          </div>

          <SubmitButton className="h-12 w-12 rounded-full p-0" aria-label={t("Send")}>
            <SendHorizontal className="h-4 w-4" />
          </SubmitButton>
        </div>
      </div>

      {attachmentError ? <p className="text-xs font-medium text-rose-500">{attachmentError}</p> : null}
      {state.message && !state.success ? <p className="text-xs font-medium text-rose-500">{state.message}</p> : null}
      {state.fields?.body ? <p className="text-xs font-medium text-rose-500">{state.fields.body}</p> : null}
      {state.fields?.mediaUrl ? <p className="text-xs font-medium text-rose-500">{state.fields.mediaUrl}</p> : null}
    </form>
  );
}
