"use server";

import { ActivityAction, ActivityEntity, MeetingStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { actionError, actionSuccess, translateActionFields, type ActionResult } from "@/lib/actions";
import { logActivity } from "@/lib/activity";
import { clientAccessWhere, meetingAccessWhere, visibleUsersWhere } from "@/lib/crm-scope";
import { prisma } from "@/lib/db";
import { getServerTranslator } from "@/lib/locale-server";
import { requireUser } from "@/lib/session";
import { getFieldErrors, meetingSchema } from "@/lib/validations";

function revalidateMeetingPaths(clientIds: string[]) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard/meetings");

  for (const clientId of clientIds) {
    revalidatePath(`/dashboard/clients/${clientId}`);
  }
}

export async function upsertMeetingAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const { t } = await getServerTranslator();
  const user = await requireUser();
  const values = Object.fromEntries(formData.entries());
  const parsedValues = meetingSchema.safeParse(values);

  if (!parsedValues.success) {
    const errors = getFieldErrors(parsedValues.error);
    return actionError(
      t(parsedValues.error.errors[0]?.message ?? "Please review the meeting form."),
      translateActionFields(errors, t, ["title", "startsAt", "endsAt", "clientId", "assignedToId", "location"]),
    );
  }

  const assignee = await prisma.user.findFirst({
    where: {
      id: parsedValues.data.assignedToId,
      ...visibleUsersWhere(user),
    },
    select: {
      id: true,
    },
  });

  if (!assignee) {
    return actionError(t("That assignee is not in your team."), {
      assignedToId: t("Choose someone from your team."),
    });
  }

  const client = await prisma.client.findFirst({
    where: {
      id: parsedValues.data.clientId,
      ...clientAccessWhere(user),
    },
    select: {
      id: true,
    },
  });

  if (!client) {
    return actionError(t("That client is not available in your workspace."), {
      clientId: t("Choose a client from your workspace."),
    });
  }

  let previousClientId: string | null = null;

  if (parsedValues.data.id) {
    const existingMeeting = await prisma.meeting.findFirst({
      where: {
        id: parsedValues.data.id,
        ...meetingAccessWhere(user),
      },
      select: {
        id: true,
        clientId: true,
      },
    });

    if (!existingMeeting) {
      return actionError(t("You can only update meetings in your workspace."));
    }

    previousClientId = existingMeeting.clientId;
  }

  const meeting = parsedValues.data.id
    ? await prisma.meeting.update({
        where: { id: parsedValues.data.id },
        data: {
          title: parsedValues.data.title,
          description: parsedValues.data.description || null,
          status: parsedValues.data.status,
          startsAt: parsedValues.data.startsAt,
          endsAt: parsedValues.data.endsAt,
          location: parsedValues.data.location || null,
          meetingLink: parsedValues.data.meetingLink || null,
          outcome: parsedValues.data.outcome || null,
          clientId: parsedValues.data.clientId,
          assignedToId: parsedValues.data.assignedToId,
        },
      })
    : await prisma.meeting.create({
        data: {
          title: parsedValues.data.title,
          description: parsedValues.data.description || null,
          status: parsedValues.data.status,
          startsAt: parsedValues.data.startsAt,
          endsAt: parsedValues.data.endsAt,
          location: parsedValues.data.location || null,
          meetingLink: parsedValues.data.meetingLink || null,
          outcome: parsedValues.data.outcome || null,
          clientId: parsedValues.data.clientId,
          assignedToId: parsedValues.data.assignedToId,
          createdById: user.id,
        },
      });

  await logActivity(prisma, {
    actorId: user.id,
    entity: ActivityEntity.MEETING,
    action: parsedValues.data.id ? ActivityAction.UPDATED : ActivityAction.CREATED,
    entityId: meeting.id,
    description: parsedValues.data.id
      ? t("Updated meeting {title}.", { title: meeting.title })
      : t("Scheduled meeting {title}.", { title: meeting.title }),
  });

  revalidateMeetingPaths(
    Array.from(new Set([parsedValues.data.clientId, previousClientId].filter((value): value is string => Boolean(value)))),
  );

  return actionSuccess(t(parsedValues.data.id ? "Meeting updated." : "Meeting created."));
}

export async function updateMeetingStatusAction(meetingId: string, status: MeetingStatus) {
  const { t } = await getServerTranslator();
  const user = await requireUser();

  const meeting = await prisma.meeting.findFirst({
    where: {
      id: meetingId,
      ...meetingAccessWhere(user),
    },
    select: {
      id: true,
      title: true,
      clientId: true,
    },
  });

  if (!meeting) {
    return;
  }

  await prisma.meeting.update({
    where: { id: meetingId },
    data: {
      status,
    },
  });

  await logActivity(prisma, {
    actorId: user.id,
    entity: ActivityEntity.MEETING,
    action: status === "COMPLETED" ? ActivityAction.COMPLETED : ActivityAction.STATUS_CHANGED,
    entityId: meeting.id,
    description:
      status === "COMPLETED"
        ? t("Marked meeting {title} as completed.", { title: meeting.title })
        : t("Updated meeting {title} to {status}.", { title: meeting.title, status: t(status) }),
  });

  revalidateMeetingPaths([meeting.clientId]);
}
