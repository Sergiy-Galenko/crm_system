"use client";

import * as React from "react";
import { startTransition, useRef, useState } from "react";
import { ImagePlus, LoaderCircle, PaintBucket, RefreshCcw, SwatchBook } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateChatAppearanceAction } from "@/actions/users";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { idleActionState, type ActionResult } from "@/lib/actions";
import { cn } from "@/lib/utils";
import type { ChatBackgroundPreference } from "./chat-types";

const supportedImageTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/gif", "image/avif"]);
const supportedImageExtensions = [".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif", ".avif"];
const backgroundImageAccept = Array.from(supportedImageTypes).join(",");
const maxBackgroundImageSize = 4 * 1024 * 1024;
const solidBackgroundPresets = ["#E2E8F0", "#DBEAFE", "#FCE7F3", "#DCFCE7", "#EDE9FE", "#FDE68A"];

function isSupportedImage(file: File) {
  if (supportedImageTypes.has(file.type)) {
    return true;
  }

  return supportedImageExtensions.some((extension) => file.name.toLowerCase().endsWith(extension));
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

function AppearanceOption({
  active,
  title,
  description,
  icon,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[1.25rem] border px-3 py-3 text-left transition",
        active
          ? "border-transparent bg-[var(--ui-brand)] text-[var(--ui-brand-foreground)] shadow-[var(--ui-shadow-xs)]"
          : "border-[var(--ui-border)] bg-[var(--ui-surface-solid)] hover:bg-[var(--ui-surface-hover)]",
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn("grid h-8 w-8 place-items-center rounded-xl", active ? "bg-black/10" : "bg-[var(--ui-surface-muted)]")}>
          {icon}
        </span>
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <p className={cn("mt-2 text-xs leading-5", active ? "text-[var(--ui-brand-foreground)]/75" : "text-slate-500")}>{description}</p>
    </button>
  );
}

export function ChatAppearanceControls({
  value,
  onPreviewChange,
}: {
  value: ChatBackgroundPreference;
  onPreviewChange: (value: ChatBackgroundPreference) => void;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ActionResult>(idleActionState);
  const [imageError, setImageError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleImageSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!isSupportedImage(file)) {
      setImageError(t("Use a valid chat background image."));
      return;
    }

    if (file.size > maxBackgroundImageSize) {
      setImageError(t("Chat background image is too large."));
      return;
    }

    try {
      const imageUrl = await fileToDataUrl(file);
      onPreviewChange({
        type: "IMAGE",
        imageUrl,
      });
      setImageError("");
    } catch {
      setImageError(t("We couldn't read that image. Try another file."));
    }
  }

  function handlePresetChange(nextValue: ChatBackgroundPreference) {
    onPreviewChange(nextValue);
    setImageError("");
  }

  function handleSave() {
    setIsSaving(true);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("chatBackgroundType", value.type);

      if (value.type === "SOLID" && value.color) {
        formData.set("chatBackgroundColor", value.color);
      }

      if (value.type === "IMAGE" && value.imageUrl) {
        formData.set("chatBackgroundImageUrl", value.imageUrl);
      }

      const nextState = await updateChatAppearanceAction(idleActionState, formData);
      setState(nextState);
      setIsSaving(false);

      if (nextState.success) {
        router.refresh();
      }
    });
  }

  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
      <div className="flex items-center gap-2 text-slate-900">
        <SwatchBook className="h-4 w-4" />
        <h4 className="text-sm font-semibold">{t("Chat appearance")}</h4>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        {t("Switch between a premium abstract canvas, a soft gradient, a solid tone, or your own uploaded image.")}
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <AppearanceOption
          active={value.type === "ABSTRACT"}
          title={t("Abstract")}
          description={t("Premium blurred shapes with calm depth by default.")}
          icon={<SparklesIcon />}
          onClick={() => handlePresetChange({ type: "ABSTRACT" })}
        />
        <AppearanceOption
          active={value.type === "GRADIENT"}
          title={t("Gradient")}
          description={t("Soft layered tones for a slightly richer workspace feel.")}
          icon={<PaintBucket className="h-4 w-4" />}
          onClick={() => handlePresetChange({ type: "GRADIENT" })}
        />
        <AppearanceOption
          active={value.type === "SOLID"}
          title={t("Solid")}
          description={t("A flatter background that keeps the thread extra calm.")}
          icon={<div className="h-4 w-4 rounded-full bg-slate-300" />}
          onClick={() => handlePresetChange({ type: "SOLID", color: value.color ?? solidBackgroundPresets[0] })}
        />
        <AppearanceOption
          active={value.type === "IMAGE"}
          title={t("Custom image")}
          description={t("Upload a light, low-noise background for a personal workspace.")}
          icon={<ImagePlus className="h-4 w-4" />}
          onClick={() => {
            if (value.imageUrl) {
              handlePresetChange({ type: "IMAGE", imageUrl: value.imageUrl });
              return;
            }

            fileInputRef.current?.click();
          }}
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={backgroundImageAccept}
        className="hidden"
        onChange={(event) => {
          void handleImageSelection(event);
        }}
      />

      {value.type === "SOLID" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {solidBackgroundPresets.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={t("Use {color} as chat background color", { color })}
              className={cn(
                "h-10 w-10 rounded-full border-2 shadow-sm transition",
                value.color?.toUpperCase() === color ? "border-slate-950 scale-105" : "border-white hover:border-slate-300",
              )}
              style={{ backgroundColor: color }}
              onClick={() => handlePresetChange({ type: "SOLID", color })}
            />
          ))}
        </div>
      ) : null}

      {value.type === "IMAGE" ? (
        <div className="mt-4 rounded-[1.25rem] border border-slate-200 bg-[var(--ui-surface-solid)] p-3">
          {value.imageUrl ? (
            <>
              <div className="overflow-hidden rounded-[1rem] border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={value.imageUrl} alt="" className="h-32 w-full object-cover" />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                  {t("Replace image")}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => handlePresetChange({ type: "ABSTRACT" })}>
                  {t("Use default")}
                </Button>
              </div>
            </>
          ) : (
            <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
              <ImagePlus className="h-4 w-4" />
              {t("Upload background")}
            </Button>
          )}
        </div>
      ) : null}

      {imageError ? <p className="mt-3 text-xs font-medium text-rose-500">{imageError}</p> : null}
      {state.message ? (
        <p className={cn("mt-3 text-xs font-medium", state.success ? "text-emerald-600" : "text-rose-500")}>
          {state.message}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          {t("Save appearance")}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => handlePresetChange({ type: "ABSTRACT" })}>
          <RefreshCcw className="h-4 w-4" />
          {t("Reset to abstract")}
        </Button>
      </div>
    </section>
  );
}

function SparklesIcon() {
  return (
    <div className="relative h-4 w-4">
      <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-current" />
      <span className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-current/80" />
      <span className="absolute bottom-0 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-current/70" />
      <span className="absolute right-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-current/80" />
    </div>
  );
}
