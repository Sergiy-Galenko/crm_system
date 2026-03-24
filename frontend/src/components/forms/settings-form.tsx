"use client";

import { useActionState, useState } from "react";
import { updateSettingsAction } from "@/actions/users";
import { FormField } from "@/components/form/form-field";
import { SubmitButton } from "@/components/form/submit-button";
import { useLocale } from "@/components/providers/locale-provider";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { idleActionState } from "@/lib/actions";
import { cn } from "@/lib/utils";

const colorPresets = ["#2154FF", "#0F9F68", "#F97316", "#E11D48", "#7C3AED", "#0EA5E9", "#111827"];

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
    avatarColor?: string | null;
  };
}) {
  const [state, formAction] = useActionState(updateSettingsAction, idleActionState);
  const { t } = useLocale();
  const [preview, setPreview] = useState({
    name: user.name,
    title: user.title ?? "",
    statusMessage: user.statusMessage ?? "",
    phone: user.phone ?? "",
    location: user.location ?? "",
    bio: user.bio ?? "",
    avatarColor: user.avatarColor ?? "#2154FF",
  });

  function updateField(field: keyof typeof preview, value: string) {
    setPreview((current) => ({
      ...current,
      [field]: value,
    }));
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
          label={t("Avatar color")}
          error={state.fields?.avatarColor}
          description={t("Choose a preset or enter your own brand color.")}
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
