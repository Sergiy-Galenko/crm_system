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
  users: Array<{ id: string; name: string; email?: string | null }>;
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
  const hasOptionalContent = Boolean(meeting?.location || meeting?.meetingLink || meeting?.description || meeting?.outcome);

  return (
    <ActionDialog
      trigger={
        <Button variant={meeting ? "secondary" : "primary"} size={meeting ? "sm" : "default"}>
          {t(triggerLabel)}
        </Button>
      }
      title={t(meeting ? "Edit meeting" : "Schedule meeting")}
      description={t("Plan the slot first. Links, notes, and outcome stay tucked away until you actually need them.")}
      state={state}
      contentClassName="max-w-2xl p-5 sm:p-6"
    >
      {() => (
        <form action={formAction} className="grid gap-5">
          <input type="hidden" name="id" value={meeting?.id ?? ""} />
          {!meeting ? <input type="hidden" name="status" value="SCHEDULED" /> : null}
          {hideClientField ? <input type="hidden" name="clientId" value={meeting?.clientId ?? defaults?.clientId ?? ""} /> : null}

          <div className="grid gap-4 rounded-[1.75rem] border border-slate-200 bg-slate-50/60 p-4 md:grid-cols-2">
            <FormField label={t("Meeting title")} error={state.fields?.title} className="md:col-span-2">
              <Input name="title" defaultValue={meeting?.title ?? ""} placeholder={t("Quarterly renewal sync")} />
            </FormField>

            <FormField label={t("Short description")} className="md:col-span-2">
              <Textarea
                name="description"
                defaultValue={meeting?.description ?? ""}
                className="min-h-24"
                placeholder={t("What should this meeting help unblock or decide?")}
              />
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
                    {user.email ? `${user.name} · ${user.email}` : user.name}
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
          </div>

          <details className="rounded-[1.75rem] border border-slate-200 bg-[var(--ui-surface-solid)] px-4 py-3" open={hasOptionalContent}>
            <summary className="cursor-pointer list-none text-sm font-medium text-slate-900">
              {t("Advanced settings")}
            </summary>
            <p className="mt-2 text-sm text-slate-500">
              {t("Add location, meeting link, status changes, or outcome notes only when they add real context.")}
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {meeting ? (
                <FormField label={t("Status")} className="md:col-span-2">
                  <Select name="status" defaultValue={meeting.status}>
                    {meetingStatuses.map((status) => (
                      <option key={status} value={status}>
                        {t(status)}
                      </option>
                    ))}
                  </Select>
                </FormField>
              ) : null}

              <FormField label={t("Location")} error={state.fields?.location}>
                <Input name="location" defaultValue={meeting?.location ?? ""} placeholder={t("Google Meet / Kyiv office")} />
              </FormField>

              <FormField label={t("Meeting link")}>
                <Input name="meetingLink" defaultValue={meeting?.meetingLink ?? ""} placeholder="https://meet.google.com/..." />
              </FormField>

              {meeting ? (
                <FormField label={t("Outcome")} className="md:col-span-2">
                  <Textarea
                    name="outcome"
                    defaultValue={meeting?.outcome ?? ""}
                    placeholder={t("Add notes after the meeting, outcomes, blockers, or next steps.")}
                    className="min-h-24"
                  />
                </FormField>
              ) : null}
            </div>
          </details>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">{t("Core scheduling stays visible first so new meetings take only a few seconds to set up.")}</p>
            <SubmitButton>{t(meeting ? "Save changes" : "Create meeting")}</SubmitButton>
          </div>
        </form>
      )}
    </ActionDialog>
  );
}
