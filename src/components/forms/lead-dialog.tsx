"use client";

import { useActionState } from "react";
import { upsertLeadAction } from "@/actions/leads";
import { ActionDialog } from "@/components/form/action-dialog";
import { FormField } from "@/components/form/form-field";
import { SubmitButton } from "@/components/form/submit-button";
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

  return (
    <ActionDialog
      trigger={<Button variant={lead ? "secondary" : "primary"}>{triggerLabel}</Button>}
      title={lead ? "Edit lead" : "Add lead"}
      description="Capture source quality, next follow-up timing, and expected revenue."
      state={state}
    >
      {() => (
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="id" value={lead?.id ?? ""} />
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Lead name" error={state.fields?.name}>
              <Input name="name" defaultValue={lead?.name} />
            </FormField>
            <FormField label="Company" error={state.fields?.company}>
              <Input name="company" defaultValue={lead?.company} />
            </FormField>
            <FormField label="Email" error={state.fields?.email}>
              <Input name="email" type="email" defaultValue={lead?.email} />
            </FormField>
            <FormField label="Phone">
              <Input name="phone" defaultValue={lead?.phone} />
            </FormField>
            <FormField label="Source">
              <Select name="source" defaultValue={lead?.source ?? "WEBSITE"}>
                {leadSources.map((source) => (
                  <option key={source} value={source}>
                    {source.replaceAll("_", " ")}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Status">
              <Select name="status" defaultValue={lead?.status ?? "NEW"}>
                {leadStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status.replaceAll("_", " ")}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Estimated value" error={state.fields?.estimatedValue}>
              <Input name="estimatedValue" type="number" step="0.01" min="0" defaultValue={lead?.estimatedValue ?? ""} />
            </FormField>
            <FormField label="Next follow-up">
              <Input name="nextFollowUpAt" type="date" defaultValue={toDateInputValue(lead?.nextFollowUpAt)} />
            </FormField>
            <FormField label="Owner">
              <Select name="ownerId" defaultValue={lead?.ownerId ?? users[0]?.id}>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Link to client">
              <Select name="clientId" defaultValue={lead?.clientId ?? ""}>
                <option value="">Not linked</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.company}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
          <div className="flex justify-end">
            <SubmitButton>{lead ? "Save changes" : "Create lead"}</SubmitButton>
          </div>
        </form>
      )}
    </ActionDialog>
  );
}
