"use server";

import { ActivityAction, ActivityEntity, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";
import { validatePromoCodeWithClient, recalculateAppliedPromo } from "@/lib/promo-codes";
import { requireUser } from "@/lib/session";
import { dealSchema, getFieldErrors, taskSchema } from "@/lib/validations";

function normalizedPromoCode(value: string | undefined) {
  return value?.trim().toUpperCase() || "";
}

export async function upsertDealAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const values = Object.fromEntries(formData.entries());
  const parsedValues = dealSchema.safeParse(values);

  if (!parsedValues.success) {
    const errors = getFieldErrors(parsedValues.error);
    return actionError(parsedValues.error.errors[0]?.message ?? "Please review the deal form.", {
      title: errors.title?.[0] ?? "",
      grossAmount: errors.grossAmount?.[0] ?? "",
      clientId: errors.clientId?.[0] ?? "",
      promoCode: errors.promoCode?.[0] ?? "",
    });
  }

  const promoCodeInput = normalizedPromoCode(parsedValues.data.promoCode);

  try {
    await prisma.$transaction(
      async (tx) => {
        const existingDeal = parsedValues.data.id
          ? await tx.deal.findUnique({
              where: { id: parsedValues.data.id },
              include: {
                promoUsage: true,
                promoCode: true,
              },
            })
          : null;

        let discountAmount = 0;
        let netAmount = parsedValues.data.grossAmount;
        let promoCodeId: string | null = null;

        const currentPromoCode = existingDeal?.promoCode?.code ?? "";
        const isSamePromoCode = Boolean(
          existingDeal?.promoUsage && currentPromoCode && currentPromoCode === promoCodeInput,
        );

        if (existingDeal?.promoUsage && !isSamePromoCode) {
          await tx.promoCodeUsage.delete({
            where: { dealId: existingDeal.id },
          });

          await tx.promoCode.update({
            where: { id: existingDeal.promoUsage.promoCodeId },
            data: {
              usedCount: {
                decrement: 1,
              },
            },
          });
        }

        if (promoCodeInput && isSamePromoCode && existingDeal?.promoUsage && existingDeal.promoCodeId) {
          const recalculated = recalculateAppliedPromo(parsedValues.data.grossAmount, existingDeal.promoUsage);
          discountAmount = recalculated.discountAmount;
          netAmount = recalculated.finalAmount;
          promoCodeId = existingDeal.promoCodeId;

          await tx.promoCodeUsage.update({
            where: { dealId: existingDeal.id },
            data: {
              dealAmount: parsedValues.data.grossAmount,
              discountAmount,
              clientId: parsedValues.data.clientId,
            },
          });
        } else if (promoCodeInput) {
          const promoValidation = await validatePromoCodeWithClient(tx, promoCodeInput, parsedValues.data.grossAmount);

          if (!promoValidation.valid) {
            throw new Error(`PROMO:${promoValidation.message}`);
          }

          discountAmount = promoValidation.discountAmount;
          netAmount = promoValidation.finalAmount;
          promoCodeId = promoValidation.promoCode.id;
        }

        const deal = existingDeal
          ? await tx.deal.update({
              where: { id: existingDeal.id },
              data: {
                title: parsedValues.data.title,
                description: parsedValues.data.description || null,
                stage: parsedValues.data.stage,
                currency: parsedValues.data.currency,
                grossAmount: parsedValues.data.grossAmount,
                discountAmount,
                netAmount,
                closeDate: parsedValues.data.closeDate,
                clientId: parsedValues.data.clientId,
                leadId: parsedValues.data.leadId || null,
                ownerId: parsedValues.data.ownerId,
                promoCodeId,
              },
            })
          : await tx.deal.create({
              data: {
                title: parsedValues.data.title,
                description: parsedValues.data.description || null,
                stage: parsedValues.data.stage,
                currency: parsedValues.data.currency,
                grossAmount: parsedValues.data.grossAmount,
                discountAmount,
                netAmount,
                closeDate: parsedValues.data.closeDate,
                clientId: parsedValues.data.clientId,
                leadId: parsedValues.data.leadId || null,
                ownerId: parsedValues.data.ownerId,
                promoCodeId,
              },
            });
        if (promoCodeInput && !isSamePromoCode) {
          const promoCode = await tx.promoCode.findUniqueOrThrow({
            where: { code: promoCodeInput },
          });

          await tx.promoCode.update({
            where: { id: promoCode.id },
            data: {
              usedCount: {
                increment: 1,
              },
            },
          });

          await tx.promoCodeUsage.create({
            data: {
              promoCodeId: promoCode.id,
              dealId: deal.id,
              clientId: parsedValues.data.clientId,
              appliedById: user.id,
              dealAmount: parsedValues.data.grossAmount,
              discountAmount,
              discountType: promoCode.discountType,
              discountValue: promoCode.discountValue,
            },
          });

          await logActivity(tx, {
            actorId: user.id,
            entity: ActivityEntity.DEAL,
            action: ActivityAction.PROMO_APPLIED,
            entityId: deal.id,
            description: `Applied ${promoCode.code} to ${deal.title}.`,
          });
        }

        await logActivity(tx, {
          actorId: user.id,
          entity: ActivityEntity.DEAL,
          action: existingDeal ? ActivityAction.UPDATED : ActivityAction.CREATED,
          entityId: deal.id,
          description: existingDeal ? `Updated deal ${deal.title}.` : `Created deal ${deal.title}.`,
        });

        const affectedClientIds = new Set<string>([parsedValues.data.clientId]);

        if (existingDeal?.clientId && existingDeal.clientId !== parsedValues.data.clientId) {
          affectedClientIds.add(existingDeal.clientId);
        }

        for (const clientId of affectedClientIds) {
          const wonRevenue = await tx.deal.aggregate({
            where: {
              clientId,
              stage: "WON",
            },
            _sum: {
              netAmount: true,
            },
          });

          await tx.client.update({
            where: { id: clientId },
            data: {
              lastContactAt: clientId === parsedValues.data.clientId ? new Date() : undefined,
              totalRevenue: wonRevenue._sum.netAmount ?? 0,
            },
          });
        }
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/deals");
    revalidatePath("/dashboard/promo-codes");
    revalidatePath("/dashboard/analytics");
    if (parsedValues.data.clientId) {
      revalidatePath(`/dashboard/clients/${parsedValues.data.clientId}`);
    }

    return actionSuccess(parsedValues.data.id ? "Deal updated." : "Deal created.");
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("PROMO:")) {
      return actionError(error.message.replace("PROMO:", ""), {
        promoCode: error.message.replace("PROMO:", ""),
      });
    }

    return actionError("Unable to save the deal right now.");
  }
}

export async function upsertTaskAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const values = Object.fromEntries(formData.entries());
  const parsedValues = taskSchema.safeParse(values);

  if (!parsedValues.success) {
    const errors = getFieldErrors(parsedValues.error);
    return actionError(parsedValues.error.errors[0]?.message ?? "Please review the task form.", {
      title: errors.title?.[0] ?? "",
      dueDate: errors.dueDate?.[0] ?? "",
    });
  }

  const task = parsedValues.data.id
    ? await prisma.task.update({
        where: { id: parsedValues.data.id },
        data: {
          title: parsedValues.data.title,
          description: parsedValues.data.description || null,
          status: parsedValues.data.status,
          priority: parsedValues.data.priority,
          dueDate: parsedValues.data.dueDate,
          assignedToId: parsedValues.data.assignedToId,
          clientId: parsedValues.data.clientId || null,
          leadId: parsedValues.data.leadId || null,
          dealId: parsedValues.data.dealId || null,
          completedAt: parsedValues.data.status === "DONE" ? new Date() : null,
        },
      })
    : await prisma.task.create({
        data: {
          title: parsedValues.data.title,
          description: parsedValues.data.description || null,
          status: parsedValues.data.status,
          priority: parsedValues.data.priority,
          dueDate: parsedValues.data.dueDate,
          assignedToId: parsedValues.data.assignedToId,
          createdById: user.id,
          clientId: parsedValues.data.clientId || null,
          leadId: parsedValues.data.leadId || null,
          dealId: parsedValues.data.dealId || null,
          completedAt: parsedValues.data.status === "DONE" ? new Date() : null,
        },
      });

  await logActivity(prisma, {
    actorId: user.id,
    entity: ActivityEntity.TASK,
    action:
      parsedValues.data.status === "DONE"
        ? ActivityAction.COMPLETED
        : parsedValues.data.id
          ? ActivityAction.UPDATED
          : ActivityAction.CREATED,
    entityId: task.id,
    description: `${parsedValues.data.id ? "Updated" : "Added"} task ${task.title}.`,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clients");

  return actionSuccess(parsedValues.data.id ? "Task updated." : "Task created.");
}

export async function markTaskDoneAction(taskId: string) {
  const user = await requireUser();

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: "DONE",
      completedAt: new Date(),
    },
  });

  await logActivity(prisma, {
    actorId: user.id,
    entity: ActivityEntity.TASK,
    action: ActivityAction.COMPLETED,
    entityId: task.id,
    description: `Completed task ${task.title}.`,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clients");
}
