"use client";

import { useActionState } from "react";
import { upsertUserAction } from "@/actions/users";
import { ActionDialog } from "@/components/form/action-dialog";
import { FormField } from "@/components/form/form-field";
import { SubmitButton } from "@/components/form/submit-button";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { idleActionState } from "@/lib/actions";
import { roles } from "@/lib/constants";

export function UserDialog({
  canAssignAdmin = false,
  user,
  triggerLabel = "Add user",
}: {
  canAssignAdmin?: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    nickname?: string | null;
    role: string;
    roleLabel?: string | null;
    title?: string | null;
  };
  triggerLabel?: string;
}) {
  const [state, formAction] = useActionState(upsertUserAction, idleActionState);
  const { t } = useLocale();
  const availableRoles = canAssignAdmin ? roles : roles.filter((role) => role !== "ADMIN");

  return (
    <ActionDialog
      trigger={<Button variant={user ? "secondary" : "primary"}>{t(triggerLabel)}</Button>}
      title={t(user ? "Edit team member" : "Add team member")}
      description={t("Manage access roles, contact identity, and optional password resets.")}
      state={state}
    >
      {() => (
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="id" value={user?.id ?? ""} />
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label={t("Name")} error={state.fields?.name}>
              <Input name="name" defaultValue={user?.name} />
            </FormField>
            <FormField label={t("Work email")} error={state.fields?.email}>
              <Input name="email" type="email" defaultValue={user?.email} />
            </FormField>
            <FormField
              label={t("Nickname")}
              error={state.fields?.nickname}
              description={t("Used so teammates can find this person by @nickname.")}
            >
              <Input name="nickname" defaultValue={user?.nickname ?? ""} placeholder="olivia" />
            </FormField>
            <FormField label={t("Role")} error={state.fields?.role}>
              <Select name="role" defaultValue={user?.role ?? "MANAGER"}>
                {availableRoles.map((role) => (
                  <option key={role} value={role}>
                    {t(role)}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField
              label={t("Custom role name")}
              error={state.fields?.roleLabel}
              description={t("Shown in the UI while permissions still follow the selected system role.")}
            >
              <Input name="roleLabel" defaultValue={user?.roleLabel ?? ""} placeholder={t("Team Lead")} />
            </FormField>
            <FormField label={t("Title")}>
              <Input name="title" defaultValue={user?.title ?? ""} />
            </FormField>
            <FormField
              label={t(user ? "Reset password" : "Password")}
              error={state.fields?.password}
              description={t(user ? "Leave blank to keep the current password." : "At least 8 characters.")}
              className="md:col-span-2"
            >
              <Input name="password" type="password" />
            </FormField>
          </div>
          <div className="flex justify-end">
            <SubmitButton>{t(user ? "Save changes" : "Create user")}</SubmitButton>
          </div>
        </form>
      )}
    </ActionDialog>
  );
}
