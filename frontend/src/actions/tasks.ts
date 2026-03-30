"use server";

import type { TaskStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { resolveProvider } from "@backend/common/nest/app-context";
import { validateDto } from "@backend/common/validation/validate-dto";
import { TasksService } from "@backend/modules/tasks/tasks.service";
import { UpsertTaskDto } from "@backend/modules/tasks/dto/upsert-task.dto";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions";
import { actionErrorFromException, toRequestUser } from "@/lib/backend-actions";
import { getServerTranslator } from "@/lib/locale-server";
import { requireUser } from "@/lib/session";

function revalidateTaskViews(clientIds: Array<string | null | undefined>) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard/tasks");

  for (const clientId of new Set(clientIds.filter((value): value is string => Boolean(value)))) {
    revalidatePath(`/dashboard/clients/${clientId}`);
  }
}

export async function upsertTaskAction(prevState: ActionResult, formData: FormData) {
  const { t } = await getServerTranslator();
  const user = await requireUser();

  try {
    const dto = await validateDto(UpsertTaskDto, Object.fromEntries(formData.entries()));
    const tasksService = await resolveProvider(TasksService);
    const result = await tasksService.upsertTask(toRequestUser(user), dto);

    revalidateTaskViews([dto.clientId, result.previousClientId]);

    return actionSuccess(t(dto.id ? "Task updated." : "Task created."));
  } catch (error) {
    const response = actionErrorFromException(error, t, {
      title: ["task title"],
      dueDate: ["due date"],
      assignedToId: ["assignee"],
      clientId: ["client"],
      leadId: ["lead"],
      dealId: ["deal"],
      tags: ["tag"],
    });

    return actionError(response.message, response.fields);
  }
}

export async function updateTaskStatusAction(taskId: string, status: TaskStatus) {
  const user = await requireUser();
  const tasksService = await resolveProvider(TasksService);
  const result = await tasksService.updateTaskStatus(toRequestUser(user), taskId, status);

  revalidateTaskViews([result.task.clientId, result.previousClientId]);
}

export async function markTaskDoneAction(taskId: string) {
  await updateTaskStatusAction(taskId, "DONE");
}

export async function restoreTaskAction(taskId: string) {
  await updateTaskStatusAction(taskId, "IN_PROGRESS");
}

export async function deleteTaskAction(taskId: string) {
  const user = await requireUser();
  const tasksService = await resolveProvider(TasksService);
  const deletedTask = await tasksService.deleteTask(toRequestUser(user), taskId);

  revalidateTaskViews([deletedTask.clientId]);
}
