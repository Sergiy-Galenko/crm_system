"use server";

import { ActivityAction, ActivityEntity } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { actionError, actionSuccess, translateActionFields, type ActionResult } from "@/lib/actions";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";
import { getServerTranslator } from "@/lib/locale-server";
import { requireUser } from "@/lib/session";
import { getFieldErrors, promoCodeSchema } from "@/lib/validations";

export async function upsertPromoCodeAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const { t } = await getServerTranslator();
  const user = await requireUser();

  if (user.role !== "ADMIN") {
    return actionError(t("Only admins can manage promo codes."));
  }

  const values = Object.fromEntries(formData.entries());
  const parsedValues = promoCodeSchema.safeParse(values);

  if (!parsedValues.success) {
    const errors = getFieldErrors(parsedValues.error);
    return actionError(
      t(parsedValues.error.errors[0]?.message ?? "Please review the promo code form."),
      translateActionFields(errors, t, ["code", "discountValue", "usageLimit"]),
    );
  }

  try {
    const promoCode = parsedValues.data.id
      ? await prisma.promoCode.update({
          where: { id: parsedValues.data.id },
          data: {
            code: parsedValues.data.code,
            description: parsedValues.data.description || null,
            active: parsedValues.data.active,
            expiresAt: parsedValues.data.expiresAt,
            usageLimit: parsedValues.data.usageLimit,
            discountType: parsedValues.data.discountType,
            discountValue: parsedValues.data.discountValue,
          },
        })
      : await prisma.promoCode.create({
          data: {
            code: parsedValues.data.code,
            description: parsedValues.data.description || null,
            active: parsedValues.data.active,
            expiresAt: parsedValues.data.expiresAt,
            usageLimit: parsedValues.data.usageLimit,
            discountType: parsedValues.data.discountType,
            discountValue: parsedValues.data.discountValue,
            createdById: user.id,
          },
        });

    await logActivity(prisma, {
      actorId: user.id,
      entity: ActivityEntity.PROMO_CODE,
      action: parsedValues.data.id ? ActivityAction.UPDATED : ActivityAction.CREATED,
      entityId: promoCode.id,
      description: parsedValues.data.id
        ? t("Updated promo code {code}.", { code: promoCode.code })
        : t("Created promo code {code}.", { code: promoCode.code }),
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/deals");
    revalidatePath("/dashboard/promo-codes");
    revalidatePath("/dashboard/analytics");

    return actionSuccess(t(parsedValues.data.id ? "Promo code updated." : "Promo code created."));
  } catch {
    return actionError(t("Unable to save the promo code right now."));
  }
}
