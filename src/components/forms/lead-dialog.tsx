"use client";

import { useActionState } from "react";
import { upsertLeadAction } from "@/actions/leads";
import { ActionDialog } from "@/components/form/action-dialog";
import { FormField } from "@/components/form/form-field";
import { SubmitButton } from "@/components/form/submit-button";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { idleActionState } from "@/lib/actions";
import { leadSources, leadStatuses } from "@/lib/constants";
import { toDateInputValue } from "@/lib/utils";

export function LeadDialog({
  users,
  clients,
  lead,
  triggerLabel = "New lead",
}: {
  users: Array<{ id: string; name: string }>;
  clients: Array<{ id: string; company: string }>;
  lead?: {
    id: string;
    name: string;
    company: string;
    email: string;
    phone: string;
    source: string;
    status: string;
    estimatedValue: number;
    ownerId: string;
    clientId?: string | null;
    nextFollowUpAt?: Date | null;
  };
  triggerLabel?: string;
}) {
  const [state, formAction] = useActionState(upsertLeadAction, idleActionState);
  const { t } = useLocale();

  return (
    <ActionDialog
      trigger={<Button variant={lead ? "secondary" : "primary"}>{t(triggerLabel)}</Button>}
      title={t(lead ? "Edit lead" : "Add lead")}
      description={t("Capture source quality, next follow-up timing, and expected revenue.")}
      state={state}
    >
      {() => (
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="id" value={lead?.id ?? ""} />
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label={t("Lead name")} error={state.fields?.name}>
              <Input name="name" defaultValue={lead?.name} />
            </FormField>
            <FormField label={t("Company")} error={state.fields?.company}>
              <Input name="company" defaultValue={lead?.company} />
            </FormField>
            <FormField label={t("Email")} error={state.fields?.email}>
              <Input name="email" type="email" defaultValue={lead?.email} />
            </FormField>
            <FormField label={t("Phone")}>
              <Input name="phone" defaultValue={lead?.phone} />
            </FormField>
            <FormField label={t("Source")}>
              <Select name="source" defaultValue={lead?.source ?? "WEBSITE"}>
                {leadSources.map((source) => (
                  <option key={source} value={source}>
                    {t(source)}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label={t("Status")}>
              <Select name="status" defaultValue={lead?.status ?? "NEW"}>
                {leadStatuses.map((status) => (
                  <option key={status} value={status}>
                    {t(status)}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label={t("Estimated value")} error={state.fields?.estimatedValue}>
              <Input name="estimatedValue" type="number" step="0.01" min="0" defaultValue={lead?.estimatedValue ?? ""} />
            </FormField>
            <FormField label={t("Next follow-up")}>
              <Input name="nextFollowUpAt" type="date" defaultValue={toDateInputValue(lead?.nextFollowUpAt)} />
            </FormField>
            <FormField label={t("Owner")}>
              <Select name="ownerId" defaultValue={lead?.ownerId ?? users[0]?.id}>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label={t("Link to client")}>
              <Select name="clientId" defaultValue={lead?.clientId ?? ""}>
                <option value="">{t("Not linked")}</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.company}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
          <div className="flex justify-end">
            <SubmitButton>{t(lead ? "Save changes" : "Create lead")}</SubmitButton>
          </div>
        </form>
      )}
    </ActionDialog>
  );
}
