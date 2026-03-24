"use client";

import { useActionState } from "react";
import { updateSettingsAction } from "@/actions/users";
import { FormField } from "@/components/form/form-field";
import { SubmitButton } from "@/components/form/submit-button";
import { Input } from "@/components/ui/input";
import { idleActionState } from "@/lib/actions";

export function SettingsForm({
  user,
}: {
  user: {
    name: string;
    title?: string | null;
    avatarColor?: string | null;
  };
}) {
  const [state, formAction] = useActionState(updateSettingsAction, idleActionState);

  return (
    <form action={formAction} className="card rounded-[2rem] p-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-950">Profile settings</h3>
        <p className="mt-1 text-sm text-slate-500">Update the identity used across the dashboard and activity feed.</p>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <FormField label="Name" error={state.fields?.name}>
          <Input name="name" defaultValue={user.name} />
        </FormField>
        <FormField label="Title">
          <Input name="title" defaultValue={user.title ?? ""} />
        </FormField>
        <FormField label="Avatar color" error={state.fields?.avatarColor} description="Hex value like #2154FF.">
          <Input name="avatarColor" defaultValue={user.avatarColor ?? "#2154FF"} />
        </FormField>
      </div>
      <div className="mt-6 flex justify-end">
        <SubmitButton>Save settings</SubmitButton>
      </div>
    </form>
  );
}
