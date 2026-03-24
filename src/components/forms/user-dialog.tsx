"use client";

import { useActionState } from "react";
import { upsertUserAction } from "@/actions/users";
import { ActionDialog } from "@/components/form/action-dialog";
import { FormField } from "@/components/form/form-field";
import { SubmitButton } from "@/components/form/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { idleActionState } from "@/lib/actions";
import { roles } from "@/lib/constants";

export function UserDialog({
  user,
  triggerLabel = "Add user",
}: {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    title?: string | null;
  };
  triggerLabel?: string;
}) {
  const [state, formAction] = useActionState(upsertUserAction, idleActionState);

  return (
    <ActionDialog
      trigger={<Button variant={user ? "secondary" : "primary"}>{triggerLabel}</Button>}
      title={user ? "Edit team member" : "Add team member"}
      description="Manage access roles, contact identity, and optional password resets."
      state={state}
    >
      {() => (
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="id" value={user?.id ?? ""} />
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Name" error={state.fields?.name}>
              <Input name="name" defaultValue={user?.name} />
            </FormField>
            <FormField label="Work email" error={state.fields?.email}>
              <Input name="email" type="email" defaultValue={user?.email} />
            </FormField>
            <FormField label="Role">
              <Select name="role" defaultValue={user?.role ?? "MANAGER"}>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Title">
              <Input name="title" defaultValue={user?.title ?? ""} />
            </FormField>
            <FormField
              label={user ? "Reset password" : "Password"}
              error={state.fields?.password}
              description={user ? "Leave blank to keep the current password." : "At least 8 characters."}
              className="md:col-span-2"
            >
              <Input name="password" type="password" />
            </FormField>
          </div>
          <div className="flex justify-end">
            <SubmitButton>{user ? "Save changes" : "Create user"}</SubmitButton>
          </div>
        </form>
      )}
    </ActionDialog>
  );
}
