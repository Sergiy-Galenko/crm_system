"use server";

import { ActivityAction, ActivityEntity } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getFieldErrors, leadSchema } from "@/lib/validations";

export async function upsertLeadAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const values = Object.fromEntries(formData.entries());
  const parsedValues = leadSchema.safeParse(values);

  if (!parsedValues.success) {
    const errors = getFieldErrors(parsedValues.error);
    return actionError(parsedValues.error.errors[0]?.message ?? "Please review the lead form.", {
      name: errors.name?.[0] ?? "",
      company: errors.company?.[0] ?? "",
      email: errors.email?.[0] ?? "",
      estimatedValue: errors.estimatedValue?.[0] ?? "",
    });
  }

  try {
    const lead = parsedValues.data.id
      ? await prisma.lead.update({
          where: { id: parsedValues.data.id },
          data: {
            name: parsedValues.data.name,
            company: parsedValues.data.company,
            email: parsedValues.data.email.toLowerCase(),
            phone: parsedValues.data.phone,
            source: parsedValues.data.source,
            status: parsedValues.data.status,
            estimatedValue: parsedValues.data.estimatedValue,
            ownerId: parsedValues.data.ownerId,
            nextFollowUpAt: parsedValues.data.nextFollowUpAt,
            clientId: parsedValues.data.clientId || null,
          },
        })
      : await prisma.lead.create({
          data: {
            name: parsedValues.data.name,
            company: parsedValues.data.company,
            email: parsedValues.data.email.toLowerCase(),
            phone: parsedValues.data.phone,
            source: parsedValues.data.source,
            status: parsedValues.data.status,
            estimatedValue: parsedValues.data.estimatedValue,
            ownerId: parsedValues.data.ownerId,
            nextFollowUpAt: parsedValues.data.nextFollowUpAt,
            clientId: parsedValues.data.clientId || null,
          },
        });

    await logActivity(prisma, {
      actorId: user.id,
      entity: ActivityEntity.LEAD,
      action: parsedValues.data.id ? ActivityAction.UPDATED : ActivityAction.CREATED,
      entityId: lead.id,
      description: parsedValues.data.id
        ? `Updated lead ${lead.company}.`
        : `Added lead ${lead.company}.`,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/leads");

    return actionSuccess(parsedValues.data.id ? "Lead updated." : "Lead created.");
  } catch {
    return actionError("Unable to save the lead right now.");
  }
}
