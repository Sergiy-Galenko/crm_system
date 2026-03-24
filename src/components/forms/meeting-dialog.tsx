"use client";

import { useActionState } from "react";
import { upsertMeetingAction } from "@/actions/meetings";
import { ActionDialog } from "@/components/form/action-dialog";
import { FormField } from "@/components/form/form-field";
import { SubmitButton } from "@/components/form/submit-button";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { idleActionState } from "@/lib/actions";
import { meetingStatuses } from "@/lib/constants";
import { toDateTimeInputValue } from "@/lib/utils";

type MeetingDialogProps = {
  users: Array<{ id: string; name: string }>;
  clients: Array<{ id: string; company: string }>;
  defaults?: {
    clientId?: string;
    assignedToId?: string;
  };
  meeting?: {
    id: string;
    title: string;
    description?: string | null;
    status: string;
    startsAt: Date;
    endsAt: Date;
    location?: string | null;
    meetingLink?: string | null;
    outcome?: string | null;
    clientId: string;
    assignedToId: string;
  };
  triggerLabel?: string;
  hideClientField?: boolean;
};

export function MeetingDialog({
  users,
  clients,
  defaults,
  meeting,
  triggerLabel = "New meeting",
  hideClientField = false,
}: MeetingDialogProps) {
  const [state, formAction] = useActionState(upsertMeetingAction, idleActionState);
  const { t } = useLocale();

  return (
    <ActionDialog
      trigger={<Button variant={meeting ? "secondary" : "primary"}>{t(triggerLabel)}</Button>}
      title={t(meeting ? "Edit meeting" : "Schedule meeting")}
      description={t("Plan meeting time, assign ownership, and keep the account timeline visible to the team.")}
      state={state}
    >
      {() => (
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="id" value={meeting?.id ?? ""} />
          {hideClientField ? <input type="hidden" name="clientId" value={meeting?.clientId ?? defaults?.clientId ?? ""} /> : null}
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label={t("Meeting title")} error={state.fields?.title} className="md:col-span-2">
              <Input name="title" defaultValue={meeting?.title ?? ""} placeholder={t("Quarterly renewal sync")} />
            </FormField>
            {!hideClientField ? (
              <FormField label={t("Client")} error={state.fields?.clientId}>
                <Select name="clientId" defaultValue={meeting?.clientId ?? defaults?.clientId ?? clients[0]?.id}>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.company}
                    </option>
                  ))}
                </Select>
              </FormField>
            ) : null}
            <FormField label={t("Assignee")} error={state.fields?.assignedToId}>
              <Select name="assignedToId" defaultValue={meeting?.assignedToId ?? defaults?.assignedToId ?? users[0]?.id}>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label={t("Status")}>
              <Select name="status" defaultValue={meeting?.status ?? "SCHEDULED"}>
                {meetingStatuses.map((status) => (
                  <option key={status} value={status}>
                    {t(status)}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label={t("Start time")} error={state.fields?.startsAt}>
              <Input name="startsAt" type="datetime-local" defaultValue={toDateTimeInputValue(meeting?.startsAt)} />
            </FormField>
            <FormField label={t("End time")} error={state.fields?.endsAt}>
              <Input name="endsAt" type="datetime-local" defaultValue={toDateTimeInputValue(meeting?.endsAt)} />
            </FormField>
            <FormField label={t("Location")} error={state.fields?.location}>
              <Input name="location" defaultValue={meeting?.location ?? ""} placeholder={t("Google Meet / Kyiv office")} />
            </FormField>
            <FormField label={t("Meeting link")}>
              <Input name="meetingLink" defaultValue={meeting?.meetingLink ?? ""} placeholder="https://meet.google.com/..." />
            </FormField>
            <FormField label={t("Description")} className="md:col-span-2">
              <Textarea name="description" defaultValue={meeting?.description ?? ""} />
            </FormField>
            <FormField label={t("Outcome")} className="md:col-span-2">
              <Textarea
                name="outcome"
                defaultValue={meeting?.outcome ?? ""}
                placeholder={t("Add notes after the meeting, outcomes, blockers, or next steps.")}
              />
            </FormField>
          </div>
          <div className="flex justify-end">
            <SubmitButton>{t(meeting ? "Save changes" : "Create meeting")}</SubmitButton>
          </div>
        </form>
      )}
    </ActionDialog>
  );
}
