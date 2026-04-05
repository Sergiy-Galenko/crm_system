"use server";

import type { MeetingStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { resolveProvider } from "@backend/common/nest/app-context";
import { validateDto } from "@backend/common/validation/validate-dto";
import { UpsertMeetingDto } from "@backend/modules/meetings/dto/upsert-meeting.dto";
import { MeetingsService } from "@backend/modules/meetings/meetings.service";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions";
import { actionErrorFromException, toRequestUser } from "@/lib/backend-actions";
import { getServerTranslator } from "@/lib/locale-server";
import { requireUser } from "@/lib/session";
import { createAndPushNotification } from "@/lib/notification-store";


export async function upsertMeetingAction(prevState: ActionResult, formData: FormData) {
  const { t } = await getServerTranslator();
  const user = await requireUser();

  try {
    const dto = await validateDto(UpsertMeetingDto, Object.fromEntries(formData.entries()));

    if (dto.endsAt <= dto.startsAt) {
      return actionError(t("Meeting end must be after the start time."), {
        endsAt: t("Meeting end must be after the start time."),
      });
    }

    const meetingsService = await resolveProvider(MeetingsService);
    const result = await meetingsService.upsertMeeting(toRequestUser(user), dto);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clients");
    revalidatePath("/dashboard/meetings");
    const clientIds = Array.from(new Set([dto.clientId, result.previousClientId].filter((value): value is string => Boolean(value))));
    for (const clientId of clientIds) {
      revalidatePath(`/dashboard/clients/${clientId}`);
    }

    // Notify the assignee when a new meeting is created and they are not the creator
    if (!dto.id && dto.assignedToId && dto.assignedToId !== user.id) {
      createAndPushNotification({
        userId: dto.assignedToId,
        title: t("New meeting scheduled for you"),
        body: dto.title,
      }).catch(() => {});
    }

    return actionSuccess(t(dto.id ? "Meeting updated." : "Meeting created."));
  } catch (error) {
    const response = actionErrorFromException(error, t, {
      title: ["meeting title"],
      startsAt: ["start"],
      endsAt: ["end"],
      clientId: ["client"],
      assignedToId: ["assignee"],
      location: ["location"],
    });

    return actionError(response.message, response.fields);
  }
}

export async function updateMeetingStatusAction(meetingId: string, status: MeetingStatus) {
  const user = await requireUser();
  const meetingsService = await resolveProvider(MeetingsService);
  const meeting = await meetingsService.updateMeetingStatus(toRequestUser(user), meetingId, status);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard/meetings");
  revalidatePath(`/dashboard/clients/${meeting.clientId}`);
}

export async function deleteMeetingAction(meetingId: string) {
  const user = await requireUser();
  const meetingsService = await resolveProvider(MeetingsService);
  const meeting = await meetingsService.deleteMeeting(toRequestUser(user), meetingId);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard/meetings");
  revalidatePath(`/dashboard/clients/${meeting.clientId}`);
}
