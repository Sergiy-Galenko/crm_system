"use server";

import { ActivityAction, ActivityEntity } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { actionError, actionSuccess, translateActionFields, type ActionResult } from "@/lib/actions";
import { logActivity } from "@/lib/activity";
import { teamUsersWhere } from "@/lib/crm-scope";
import { prisma } from "@/lib/db";
import { getServerTranslator } from "@/lib/locale-server";
import { hashPassword, requireUser } from "@/lib/session";
import { getFieldErrors, settingsSchema, userSchema } from "@/lib/validations";

export async function upsertUserAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const { t } = await getServerTranslator();
  const currentUser = await requireUser();
  const canAssignAdmin = currentUser.role === "ADMIN";

  if (currentUser.role !== "ADMIN" && currentUser.role !== "MANAGER") {
    return actionError(t("Only admins and managers can manage users."));
  }

  const values = Object.fromEntries(formData.entries());
  const parsedValues = userSchema.safeParse(values);

  if (!parsedValues.success) {
    const errors = getFieldErrors(parsedValues.error);
    return actionError(
      t(parsedValues.error.errors[0]?.message ?? "Please review the user form."),
      translateActionFields(errors, t, ["name", "email", "roleLabel", "password"]),
    );
  }

  if (!parsedValues.data.id && !parsedValues.data.password) {
    return actionError(t("New users require a password."), {
      password: t("Password is required."),
    });
  }

  if (!canAssignAdmin && parsedValues.data.role === "ADMIN") {
    return actionError(t("Managers cannot create admin accounts."), {
      role: t("Choose the manager role for this teammate."),
    });
  }

  if (parsedValues.data.id && !canAssignAdmin) {
    const managedUser = await prisma.user.findFirst({
      where: {
        id: parsedValues.data.id,
        ...teamUsersWhere(currentUser),
      },
      select: {
        id: true,
      },
    });

    if (!managedUser) {
      return actionError(t("Managers can only manage users in their own team."));
    }
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
            roleLabel: parsedValues.data.roleLabel || null,
            title: parsedValues.data.title || null,
            passwordHash,
          },
        })
      : await prisma.user.create({
          data: {
            name: parsedValues.data.name,
            email: parsedValues.data.email.toLowerCase(),
            role: parsedValues.data.role,
            roleLabel: parsedValues.data.roleLabel || null,
            title: parsedValues.data.title || null,
            passwordHash: passwordHash!,
            createdById: currentUser.id,
          },
        });

    await logActivity(prisma, {
      actorId: currentUser.id,
      entity: ActivityEntity.USER,
      action: parsedValues.data.id ? ActivityAction.UPDATED : ActivityAction.CREATED,
      entityId: user.id,
      description: parsedValues.data.id
        ? t("Updated user {email}.", { email: user.email })
        : t("Invited user {email}.", { email: user.email }),
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/clients");
    revalidatePath("/dashboard/leads");
    revalidatePath("/dashboard/deals");

    return actionSuccess(t(parsedValues.data.id ? "User updated." : "User created."));
  } catch {
    return actionError(t("Unable to save the user right now."));
  }
}

export async function updateSettingsAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const { t } = await getServerTranslator();
  const currentUser = await requireUser();
  const values = Object.fromEntries(formData.entries());
  const parsedValues = settingsSchema.safeParse(values);

  if (!parsedValues.success) {
    const errors = getFieldErrors(parsedValues.error);
    return actionError(
      t(parsedValues.error.errors[0]?.message ?? "Please review your settings."),
      translateActionFields(errors, t, ["name", "avatarColor"]),
    );
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
    description: t("{name} updated profile settings.", { name: parsedValues.data.name }),
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");

  return actionSuccess(t("Settings updated."));
}
