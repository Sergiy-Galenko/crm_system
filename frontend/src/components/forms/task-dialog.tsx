"use client";

import { useActionState } from "react";
import { upsertTaskAction } from "@/actions/tasks";
import { ActionDialog } from "@/components/form/action-dialog";
import { FormField } from "@/components/form/form-field";
import { SubmitButton } from "@/components/form/submit-button";
import { useLocale } from "@/components/providers/locale-provider";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { idleActionState } from "@/lib/actions";
import { taskPriorities, taskStatuses } from "@/lib/constants";
import { cn, toDateInputValue } from "@/lib/utils";

export function TaskDialog({
  users,
  clients,
  leads,
  deals,
  defaults,
  defaultDueDate,
  task,
  showLinkedRecords = false,
  triggerLabel = "Add task",
  triggerVariant,
  triggerSize,
  triggerClassName,
  onSuccess,
}: {
  users: Array<{ id: string; name: string; email?: string | null }>;
  clients?: Array<{ id: string; company: string }>;
  leads?: Array<{ id: string; company: string }>;
  deals?: Array<{ id: string; title: string }>;
  defaults?: {
    assignedToId?: string;
    clientId?: string;
    leadId?: string;
    dealId?: string;
  };
  defaultDueDate?: string;
  task?: {
    id: string;
    title: string;
    description?: string | null;
    status: string;
    priority: string;
    dueDate: Date;
    assignedToId?: string | null;
    tags?: string[];
    clientId?: string | null;
    leadId?: string | null;
    dealId?: string | null;
  };
  showLinkedRecords?: boolean;
  triggerLabel?: string;
  triggerVariant?: ButtonProps["variant"];
  triggerSize?: ButtonProps["size"];
  triggerClassName?: string;
  onSuccess?: () => void;
}) {
  const [state, formAction] = useActionState(upsertTaskAction, idleActionState);
  const { t } = useLocale();
  const tagsValue = task?.tags?.join(", ") ?? "";
  const dueDateValue = task?.dueDate ? toDateInputValue(task.dueDate) : defaultDueDate ?? "";
  const hasAdvancedFields = Boolean(
    task?.tags?.length
    || task?.clientId
    || task?.leadId
    || task?.dealId
    || defaults?.clientId
    || defaults?.leadId
    || defaults?.dealId,
  );

  return (
    <ActionDialog
      trigger={
        <Button
          type="button"
          variant={triggerVariant ?? (task ? "secondary" : "primary")}
          size={triggerSize ?? (task ? "sm" : "default")}
          className={cn(task ? "rounded-xl" : "rounded-2xl", triggerClassName)}
        >
          {t(triggerLabel)}
        </Button>
      }
      title={t(task ? "Edit task" : "Create task")}
      description={t("Keep task setup lightweight. The core execution fields stay up front, while extra context is tucked away until you need it.")}
      state={state}
      contentClassName="max-w-2xl"
      onSuccess={onSuccess}
    >
      {() => (
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="id" value={task?.id ?? ""} />
          {!showLinkedRecords ? <input type="hidden" name="clientId" value={task?.clientId ?? defaults?.clientId ?? ""} /> : null}
          {!showLinkedRecords ? <input type="hidden" name="leadId" value={task?.leadId ?? defaults?.leadId ?? ""} /> : null}
          {!showLinkedRecords ? <input type="hidden" name="dealId" value={task?.dealId ?? defaults?.dealId ?? ""} /> : null}
          {state.message && !state.success ? (
            <div className="rounded-[1.35rem] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {state.message}
            </div>
          ) : null}
          <div className="grid gap-4 rounded-[1.9rem] border border-[var(--ui-border)] bg-[linear-gradient(180deg,var(--ui-surface-elevated),var(--ui-surface-soft))] p-4 shadow-[var(--ui-shadow-xs)] md:grid-cols-2 md:p-5">
            <FormField label={t("Task title")} error={state.fields?.title} className="md:col-span-2">
              <Input
                name="title"
                defaultValue={task?.title}
                placeholder={t("Prepare proposal review")}
                className="rounded-[1.1rem] shadow-none"
                required
              />
            </FormField>
            <FormField label={t("Short description")} className="md:col-span-2">
              <Textarea
                name="description"
                defaultValue={task?.description ?? ""}
                className="min-h-28 rounded-[1.1rem] shadow-none"
                placeholder={t("Add just enough context so the assignee knows the next move.")}
              />
            </FormField>
            <FormField label={t("Status")}>
              <Select name="status" defaultValue={task?.status ?? "TODO"} className="rounded-[1.1rem] shadow-none">
                {taskStatuses.map((status) => (
                  <option key={status} value={status}>
                    {t(status)}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label={t("Priority")}>
              <Select name="priority" defaultValue={task?.priority ?? "MEDIUM"} className="rounded-[1.1rem] shadow-none">
                {taskPriorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {t(priority)}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label={t("Due date")} error={state.fields?.dueDate}>
              <Input
                name="dueDate"
                type="date"
                defaultValue={dueDateValue}
                className="rounded-[1.1rem] shadow-none"
                required
              />
            </FormField>
            <FormField label={t("Assignee")} error={state.fields?.assignedToId}>
              <Select
                name="assignedToId"
                defaultValue={task?.assignedToId ?? defaults?.assignedToId ?? ""}
                className="rounded-[1.1rem] shadow-none"
              >
                <option value="">{t("Unassigned")}</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.email ? `${user.name} · ${user.email}` : user.name}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          {(showLinkedRecords || hasAdvancedFields) ? (
            <details
              className="rounded-[1.75rem] border border-[var(--ui-border)] bg-[var(--ui-surface-soft)] px-4 py-3 shadow-[var(--ui-shadow-xs)]"
              open={hasAdvancedFields}
            >
              <summary className="cursor-pointer list-none text-sm font-medium text-[var(--ui-text-strong)]">
                {t("Advanced settings")}
              </summary>
              <p className="mt-2 text-sm text-[var(--ui-text-muted)]">
                {t("Tags and linked records stay here so the core task flow remains clear and fast.")}
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <FormField label={t("Tags")} error={state.fields?.tags} className="md:col-span-2">
                  <Input
                    name="tags"
                    defaultValue={tagsValue}
                    placeholder={t("Add tags separated by commas")}
                    className="rounded-[1.1rem] shadow-none"
                  />
                </FormField>
                {showLinkedRecords ? (
                  <>
                    <FormField label={t("Client")}>
                      <Select
                        name="clientId"
                        defaultValue={task?.clientId ?? defaults?.clientId ?? ""}
                        className="rounded-[1.1rem] shadow-none"
                      >
                        <option value="">{t("No client")}</option>
                        {clients?.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.company}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                    <FormField label={t("Lead")}>
                      <Select
                        name="leadId"
                        defaultValue={task?.leadId ?? defaults?.leadId ?? ""}
                        className="rounded-[1.1rem] shadow-none"
                      >
                        <option value="">{t("No lead")}</option>
                        {leads?.map((lead) => (
                          <option key={lead.id} value={lead.id}>
                            {lead.company}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                    <FormField label={t("Deal")} className="md:col-span-2">
                      <Select
                        name="dealId"
                        defaultValue={task?.dealId ?? defaults?.dealId ?? ""}
                        className="rounded-[1.1rem] shadow-none"
                      >
                        <option value="">{t("No deal")}</option>
                        {deals?.map((deal) => (
                          <option key={deal.id} value={deal.id}>
                            {deal.title}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                  </>
                ) : null}
              </div>
            </details>
          ) : null}
          <div className="flex justify-end pt-1">
            <SubmitButton>{t(task ? "Save changes" : "Create task")}</SubmitButton>
          </div>
        </form>
      )}
    </ActionDialog>
  );
}
