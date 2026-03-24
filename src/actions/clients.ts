"use server";

import { ActivityAction, ActivityEntity } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { actionError, actionSuccess, translateActionFields, type ActionResult } from "@/lib/actions";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";
import { getServerTranslator } from "@/lib/locale-server";
import { requireUser } from "@/lib/session";
import { clientSchema, getFieldErrors, noteSchema } from "@/lib/validations";

export async function upsertClientAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const { t } = await getServerTranslator();
  const user = await requireUser();
  const values = Object.fromEntries(formData.entries());
  const parsedValues = clientSchema.safeParse(values);

  if (!parsedValues.success) {
    const errors = getFieldErrors(parsedValues.error);
    return actionError(
      t(parsedValues.error.errors[0]?.message ?? "Please review the client form."),
      translateActionFields(errors, t, ["name", "company", "email", "phone", "monthlyValue"]),
    );
  }

  try {
    const client = parsedValues.data.id
      ? await prisma.client.update({
          where: { id: parsedValues.data.id },
          data: {
            name: parsedValues.data.name,
            company: parsedValues.data.company,
            email: parsedValues.data.email.toLowerCase(),
            phone: parsedValues.data.phone,
            status: parsedValues.data.status,
            segment: parsedValues.data.segment || null,
            location: parsedValues.data.location || null,
            monthlyValue: parsedValues.data.monthlyValue,
            ownerId: parsedValues.data.ownerId,
          },
        })
      : await prisma.client.create({
          data: {
            name: parsedValues.data.name,
            company: parsedValues.data.company,
            email: parsedValues.data.email.toLowerCase(),
            phone: parsedValues.data.phone,
            status: parsedValues.data.status,
            segment: parsedValues.data.segment || null,
            location: parsedValues.data.location || null,
            monthlyValue: parsedValues.data.monthlyValue,
            ownerId: parsedValues.data.ownerId,
            lastContactAt: new Date(),
          },
        });

    await logActivity(prisma, {
      actorId: user.id,
      entity: ActivityEntity.CLIENT,
      action: parsedValues.data.id ? ActivityAction.UPDATED : ActivityAction.CREATED,
      entityId: client.id,
      description: parsedValues.data.id
        ? t("Updated client {company}.", { company: client.company })
        : t("Added client {company}.", { company: client.company }),
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clients");
    revalidatePath(`/dashboard/clients/${client.id}`);

    return actionSuccess(t(parsedValues.data.id ? "Client updated." : "Client created."));
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return actionError(t("That email is already attached to another client."), {
        email: t("Use a different email address."),
      });
    }

    return actionError(t("Unable to save the client right now."));
  }
}

export async function createNoteAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const { t } = await getServerTranslator();
  const user = await requireUser();
  const values = Object.fromEntries(formData.entries());
  const parsedValues = noteSchema.safeParse(values);

  if (!parsedValues.success) {
    return actionError(t(parsedValues.error.errors[0]?.message ?? "Please review the note."));
  }

  const note = await prisma.note.create({
    data: {
      body: parsedValues.data.body,
      authorId: user.id,
      clientId: parsedValues.data.clientId || null,
      leadId: parsedValues.data.leadId || null,
      dealId: parsedValues.data.dealId || null,
    },
  });

  await logActivity(prisma, {
    actorId: user.id,
    entity: ActivityEntity.NOTE,
    action: ActivityAction.CREATED,
    entityId: note.id,
    description: t("Added a new note to the CRM timeline."),
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clients");
  if (parsedValues.data.clientId) {
    revalidatePath(`/dashboard/clients/${parsedValues.data.clientId}`);
  }

  return actionSuccess(t("Note added."));
}
