"use client";

import { useActionState } from "react";
import { upsertTaskAction } from "@/actions/deals";
import { ActionDialog } from "@/components/form/action-dialog";
import { FormField } from "@/components/form/form-field";
import { SubmitButton } from "@/components/form/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { idleActionState } from "@/lib/actions";
import { taskPriorities, taskStatuses } from "@/lib/constants";
import { toDateInputValue } from "@/lib/utils";

export function TaskDialog({
  users,
  defaults,
  task,
  triggerLabel = "New task",
}: {
  users: Array<{ id: string; name: string }>;
  defaults?: {
    clientId?: string;
    leadId?: string;
    dealId?: string;
  };
  task?: {
    id: string;
    title: string;
    description?: string | null;
    status: string;
    priority: string;
    dueDate: Date;
    assignedToId: string;
    clientId?: string | null;
    leadId?: string | null;
    dealId?: string | null;
  };
  triggerLabel?: string;
}) {
  const [state, formAction] = useActionState(upsertTaskAction, idleActionState);

  return (
    <ActionDialog
      trigger={<Button variant={task ? "secondary" : "primary"}>{triggerLabel}</Button>}
      title={task ? "Edit follow-up" : "Create follow-up"}
      description="Assign responsibility, set due dates, and keep next actions visible."
      state={state}
    >
      {() => (
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="id" value={task?.id ?? ""} />
          <input type="hidden" name="clientId" value={task?.clientId ?? defaults?.clientId ?? ""} />
          <input type="hidden" name="leadId" value={task?.leadId ?? defaults?.leadId ?? ""} />
          <input type="hidden" name="dealId" value={task?.dealId ?? defaults?.dealId ?? ""} />
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Task title" error={state.fields?.title} className="md:col-span-2">
              <Input name="title" defaultValue={task?.title} />
            </FormField>
            <FormField label="Status">
              <Select name="status" defaultValue={task?.status ?? "TODO"}>
                {taskStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status.replaceAll("_", " ")}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Priority">
              <Select name="priority" defaultValue={task?.priority ?? "MEDIUM"}>
                {taskPriorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Due date" error={state.fields?.dueDate}>
              <Input name="dueDate" type="date" defaultValue={toDateInputValue(task?.dueDate)} />
            </FormField>
            <FormField label="Assignee">
              <Select name="assignedToId" defaultValue={task?.assignedToId ?? users[0]?.id}>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Description" className="md:col-span-2">
              <Textarea name="description" defaultValue={task?.description ?? ""} />
            </FormField>
          </div>
          <div className="flex justify-end">
            <SubmitButton>{task ? "Save changes" : "Create follow-up"}</SubmitButton>
          </div>
        </form>
      )}
    </ActionDialog>
  );
}
