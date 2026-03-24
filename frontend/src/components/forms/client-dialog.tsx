"use client";

import { useActionState } from "react";
import { upsertClientAction } from "@/actions/clients";
import { ActionDialog } from "@/components/form/action-dialog";
import { FormField } from "@/components/form/form-field";
import { SubmitButton } from "@/components/form/submit-button";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { idleActionState } from "@/lib/actions";
import { clientStatuses } from "@/lib/constants";

type UserOption = {
  id: string;
  name: string;
};

type ClientInput = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: string;
  segment?: string | null;
  location?: string | null;
  monthlyValue: number;
  ownerId: string;
};

export function ClientDialog({
  users,
  client,
  triggerLabel = "New client",
}: {
  users: UserOption[];
  client?: ClientInput;
  triggerLabel?: string;
}) {
  const [state, formAction] = useActionState(upsertClientAction, idleActionState);
  const { t } = useLocale();

  return (
    <ActionDialog
      trigger={<Button variant={client ? "secondary" : "primary"}>{t(triggerLabel)}</Button>}
      title={t(client ? "Edit client" : "Add client")}
      description={t("Track account health, revenue, ownership, and relationship metadata.")}
      state={state}
    >
      {() => (
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="id" value={client?.id ?? ""} />
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label={t("Contact name")} error={state.fields?.name}>
              <Input name="name" defaultValue={client?.name} />
            </FormField>
            <FormField label={t("Company")} error={state.fields?.company}>
              <Input name="company" defaultValue={client?.company} />
            </FormField>
            <FormField label={t("Email")} error={state.fields?.email}>
              <Input name="email" type="email" defaultValue={client?.email} />
            </FormField>
            <FormField label={t("Phone")} error={state.fields?.phone}>
              <Input name="phone" defaultValue={client?.phone} />
            </FormField>
            <FormField label={t("Status")}>
              <Select name="status" defaultValue={client?.status ?? "ACTIVE"}>
                {clientStatuses.map((status) => (
                  <option key={status} value={status}>
                    {t(status)}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label={t("Monthly value")} error={state.fields?.monthlyValue}>
              <Input name="monthlyValue" type="number" min="0" step="0.01" defaultValue={client?.monthlyValue ?? ""} />
            </FormField>
            <FormField label={t("Segment")}>
              <Input name="segment" defaultValue={client?.segment ?? ""} />
            </FormField>
            <FormField label={t("Location")}>
              <Input name="location" defaultValue={client?.location ?? ""} />
            </FormField>
            <FormField label={t("Owner")} error={state.fields?.ownerId}>
              <Select name="ownerId" defaultValue={client?.ownerId ?? users[0]?.id}>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
          <div className="flex justify-end">
            <SubmitButton>{t(client ? "Save changes" : "Create client")}</SubmitButton>
          </div>
        </form>
      )}
    </ActionDialog>
  );
}
