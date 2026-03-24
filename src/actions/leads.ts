"use server";

import { ActivityAction, ActivityEntity } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { actionError, actionSuccess, translateActionFields, type ActionResult } from "@/lib/actions";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";
import { getServerTranslator } from "@/lib/locale-server";
import { requireUser } from "@/lib/session";
import { getFieldErrors, leadSchema } from "@/lib/validations";

export async function upsertLeadAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const { t } = await getServerTranslator();
  const user = await requireUser();
  const values = Object.fromEntries(formData.entries());
  const parsedValues = leadSchema.safeParse(values);

  if (!parsedValues.success) {
    const errors = getFieldErrors(parsedValues.error);
    return actionError(
      t(parsedValues.error.errors[0]?.message ?? "Please review the lead form."),
      translateActionFields(errors, t, ["name", "company", "email", "estimatedValue"]),
    );
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
        ? t("Updated lead {company}.", { company: lead.company })
        : t("Added lead {company}.", { company: lead.company }),
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/leads");

    return actionSuccess(t(parsedValues.data.id ? "Lead updated." : "Lead created."));
  } catch {
    return actionError(t("Unable to save the lead right now."));
  }
}
