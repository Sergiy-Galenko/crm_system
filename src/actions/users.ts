"use server";

import { ActivityAction, ActivityEntity } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions";
import { logActivity } from "@/lib/activity";
import { prisma } from "@/lib/db";
import { hashPassword, requireUser } from "@/lib/session";
import { getFieldErrors, settingsSchema, userSchema } from "@/lib/validations";

export async function upsertUserAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const currentUser = await requireUser();

  if (currentUser.role !== "ADMIN") {
    return actionError("Only admins can manage users.");
  }

  const values = Object.fromEntries(formData.entries());
  const parsedValues = userSchema.safeParse(values);

  if (!parsedValues.success) {
    const errors = getFieldErrors(parsedValues.error);
    return actionError(parsedValues.error.errors[0]?.message ?? "Please review the user form.", {
      name: errors.name?.[0] ?? "",
      email: errors.email?.[0] ?? "",
      password: errors.password?.[0] ?? "",
    });
  }

  if (!parsedValues.data.id && !parsedValues.data.password) {
    return actionError("New users require a password.", {
      password: "Password is required.",
    });
  }

  const passwordHash = parsedValues.data.password ? await hashPassword(parsedValues.data.password) : undefined;

  try {
    const user = parsedValues.data.id
      ? await prisma.user.update({
          where: { id: parsedValues.data.id },
          data: {
            name: parsedValues.data.name,
            email: parsedValues.data.email.toLowerCase(),
            role: parsedValues.data.role,
            title: parsedValues.data.title || null,
            passwordHash,
          },
        })
      : await prisma.user.create({
          data: {
            name: parsedValues.data.name,
            email: parsedValues.data.email.toLowerCase(),
            role: parsedValues.data.role,
            title: parsedValues.data.title || null,
            passwordHash: passwordHash!,
          },
        });

    await logActivity(prisma, {
      actorId: currentUser.id,
      entity: ActivityEntity.USER,
      action: parsedValues.data.id ? ActivityAction.UPDATED : ActivityAction.CREATED,
      entityId: user.id,
      description: parsedValues.data.id
        ? `Updated user ${user.email}.`
        : `Invited user ${user.email}.`,
    });

    revalidatePath("/dashboard/settings");

    return actionSuccess(parsedValues.data.id ? "User updated." : "User created.");
  } catch {
    return actionError("Unable to save the user right now.");
  }
}

export async function updateSettingsAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const currentUser = await requireUser();
  const values = Object.fromEntries(formData.entries());
  const parsedValues = settingsSchema.safeParse(values);

  if (!parsedValues.success) {
    const errors = getFieldErrors(parsedValues.error);
    return actionError(parsedValues.error.errors[0]?.message ?? "Please review your settings.", {
      name: errors.name?.[0] ?? "",
      avatarColor: errors.avatarColor?.[0] ?? "",
    });
  }

  await prisma.user.update({
    where: { id: currentUser.id },
    data: {
      name: parsedValues.data.name,
      title: parsedValues.data.title || null,
      avatarColor: parsedValues.data.avatarColor,
    },
  });

  await logActivity(prisma, {
    actorId: currentUser.id,
    entity: ActivityEntity.USER,
    action: ActivityAction.UPDATED,
    entityId: currentUser.id,
    description: `${parsedValues.data.name} updated profile settings.`,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");

  return actionSuccess("Settings updated.");
}
