"use client";

import * as React from "react";
import { useActionState, useRef, useState } from "react";
import { updateSettingsAction } from "@/actions/users";
import { FormField } from "@/components/form/form-field";
import { SubmitButton } from "@/components/form/submit-button";
import { useLocale } from "@/components/providers/locale-provider";
import { UserAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { idleActionState } from "@/lib/actions";
import { cn } from "@/lib/utils";

const colorPresets = ["#2154FF", "#0F9F68", "#F97316", "#E11D48", "#7C3AED", "#0EA5E9", "#111827"];
const supportedLogoTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/gif", "image/avif"]);
const supportedLogoExtensions = [".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif", ".avif"];
const logoFileAccept = Array.from(supportedLogoTypes).join(",");
const maxLogoFileSizeBytes = 2 * 1024 * 1024;

function isUploadedDataUrl(value: string) {
  return value.startsWith("data:image/");
}

function isSupportedLogoFile(file: File) {
  if (supportedLogoTypes.has(file.type)) {
    return true;
  }

  const lowerCaseName = file.name.toLowerCase();
  return supportedLogoExtensions.some((extension) => lowerCaseName.endsWith(extension));
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

export function SettingsForm({
  user,
}: {
  user: {
    name: string;
    title?: string | null;
    statusMessage?: string | null;
    phone?: string | null;
    location?: string | null;
    bio?: string | null;
    companyLogoUrl?: string | null;
    avatarColor?: string | null;
  };
}) {
  const [state, formAction] = useActionState(updateSettingsAction, idleActionState);
  const { t } = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState({
    name: user.name,
    title: user.title ?? "",
    statusMessage: user.statusMessage ?? "",
    phone: user.phone ?? "",
    location: user.location ?? "",
    bio: user.bio ?? "",
    companyLogoUrl: user.companyLogoUrl ?? "",
    avatarColor: user.avatarColor ?? "#2154FF",
  });

  function updateCompanyLogoUrl(value: string) {
    setPreview((current) => ({
      ...current,
      companyLogoUrl: value,
    }));

    if (!isUploadedDataUrl(value)) {
      setUploadedFileName(null);
    }

    setLogoUploadError("");
  }

  function updateField(field: keyof typeof preview, value: string) {
    if (field === "companyLogoUrl") {
      updateCompanyLogoUrl(value);
      return;
    }

    setPreview((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleLogoFile(file: File) {
    if (!isSupportedLogoFile(file)) {
      setLogoUploadError(t("This file format is not supported."));
      return;
    }

    if (file.size > maxLogoFileSizeBytes) {
      setLogoUploadError(t("Logo files must be 2 MB or smaller."));
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      updateCompanyLogoUrl(dataUrl);
      setUploadedFileName(file.name);
    } catch {
      setLogoUploadError(t("We couldn't read that image. Try another file."));
    }
  }

  async function handleLogoFileSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    await handleLogoFile(file);
  }

  async function handleLogoDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingLogo(false);

    const file = event.dataTransfer.files?.[0];

    if (!file) {
      return;
    }

    await handleLogoFile(file);
  }

  function handleOpenLogoPicker() {
    fileInputRef.current?.click();
  }

  function handleRemoveLogo(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    updateCompanyLogoUrl("");
  }

  return (
    <form action={formAction} className="card p-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-950">{t("Profile settings")}</h3>
        <p className="mt-1 text-sm text-slate-500">{t("Add richer contact details, a status line, and a short bio for a more tailored workspace identity.")}</p>
      </div>

      {state.message ? (
        <p className={cn("mt-4 rounded-xl border px-3 py-2 text-sm", state.success ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-600")}>
          {state.message}
        </p>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 md:col-span-2">
          <div className="flex items-center gap-4">
            <UserAvatar
              name={preview.name}
              color={preview.avatarColor}
              imageUrl={preview.companyLogoUrl}
              className="h-20 w-20 rounded-[1.5rem]"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-950">{t("Logo preview")}</p>
              <p className="mt-1 text-sm text-slate-500">
                {t("If a company logo URL is set, it will replace the colored avatar in the sidebar, header, and profile card.")}
              </p>
            </div>
          </div>
        </div>
        <FormField label={t("Name")} error={state.fields?.name}>
          <Input name="name" value={preview.name} onChange={(event) => updateField("name", event.target.value)} />
        </FormField>
        <FormField label={t("Title")} error={state.fields?.title}>
          <Input name="title" value={preview.title} onChange={(event) => updateField("title", event.target.value)} />
        </FormField>
        <FormField label={t("Status message")} error={state.fields?.statusMessage} description={t("A short line shown in the sidebar and user menu.")}>
          <Input name="statusMessage" value={preview.statusMessage} onChange={(event) => updateField("statusMessage", event.target.value)} placeholder={t("Renewals, enterprise growth, and account health.")} />
        </FormField>
        <FormField label={t("Phone")} error={state.fields?.phone}>
          <Input name="phone" value={preview.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder={t("+380 67 123 45 67")} />
        </FormField>
        <FormField label={t("Location")} error={state.fields?.location}>
          <Input name="location" value={preview.location} onChange={(event) => updateField("location", event.target.value)} placeholder={t("Kyiv, Ukraine")} />
        </FormField>
        <FormField
          label={t("Upload logo")}
          error={logoUploadError || state.fields?.companyLogoUrl}
          className="md:col-span-2"
        >
          <input type="hidden" name="companyLogoUrl" value={preview.companyLogoUrl} />
          <input
            ref={fileInputRef}
            type="file"
            accept={logoFileAccept}
            className="hidden"
            onChange={(event) => {
              void handleLogoFileSelection(event);
            }}
          />
          <div
            role="button"
            tabIndex={0}
            aria-label={t("Upload logo")}
            className={cn(
              "overflow-hidden rounded-[1.5rem] border-2 border-dashed bg-slate-50 p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-slate-300 md:p-5",
              isDraggingLogo ? "border-slate-950 bg-slate-100" : "border-slate-200 hover:border-slate-400",
            )}
            onClick={handleOpenLogoPicker}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDraggingLogo(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "copy";
              setIsDraggingLogo(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDraggingLogo(false);
            }}
            onDrop={(event) => {
              void handleLogoDrop(event);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleOpenLogoPicker();
              }
            }}
          >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-950">{t("Drag and drop an image here, or click to choose a file.")}</p>
                <p className="mt-1 text-sm text-slate-500">{t("Supported formats: PNG, JPG, WEBP, SVG, GIF, AVIF up to 2 MB.")}</p>
                {uploadedFileName ? (
                  <p className="mt-3 max-w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
                    <span className="block text-[11px] uppercase tracking-[0.14em] text-slate-400">{t("Current logo source")}</span>
                    <span className="mt-1 block truncate">{t("Uploaded file: {name}", { name: uploadedFileName })}</span>
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col lg:items-stretch">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleOpenLogoPicker();
                  }}
                >
                  {t("Choose file")}
                </Button>
                {preview.companyLogoUrl ? (
                  <Button type="button" variant="ghost" size="sm" onClick={handleRemoveLogo}>
                    {t("Remove logo")}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-800">{t("Or paste a logo URL")}</p>
            <Input
              value={isUploadedDataUrl(preview.companyLogoUrl) ? "" : preview.companyLogoUrl}
              onChange={(event) => updateCompanyLogoUrl(event.target.value)}
              placeholder={t("https://your-company.com/logo.svg")}
            />
          </div>
        </FormField>
        <FormField
          label={t("Avatar color")}
          error={state.fields?.avatarColor}
          description={t("Used as a fallback when no company logo is set.")}
        >
          <div className="space-y-3">
            <Input name="avatarColor" value={preview.avatarColor} onChange={(event) => updateField("avatarColor", event.target.value.toUpperCase())} />
            <div className="flex flex-wrap gap-2">
              {colorPresets.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={t("Use {color} as avatar color", { color })}
                  className={cn(
                    "h-9 w-9 rounded-full border-2 transition",
                    preview.avatarColor.toUpperCase() === color ? "border-slate-950 scale-105" : "border-white shadow-sm hover:border-slate-300",
                  )}
                  onClick={() => updateField("avatarColor", color)}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </FormField>
        <FormField label={t("Bio")} error={state.fields?.bio} description={t("Add a short intro, focus area, or working style.")} className="md:col-span-2">
          <Textarea
            name="bio"
            value={preview.bio}
            onChange={(event) => updateField("bio", event.target.value)}
            placeholder={t("I lead renewals, commercial follow-ups, and expansion planning for strategic accounts.")}
          />
        </FormField>
      </div>

      <div className="mt-6 flex justify-end">
        <SubmitButton>{t("Save settings")}</SubmitButton>
      </div>
    </form>
  );
}
