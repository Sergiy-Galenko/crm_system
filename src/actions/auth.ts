"use server";

import { ActivityAction, ActivityEntity } from "@prisma/client";
import { redirect } from "next/navigation";
import { actionError, translateActionFields, type ActionResult } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { getServerTranslator } from "@/lib/locale-server";
import { createSessionCookie, hashPassword, verifyPassword, clearSessionCookie, getCurrentUser } from "@/lib/session";
import { getFieldErrors, loginSchema, registerSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity";

const missingDatabaseMessage =
  "DATABASE_URL is not configured. Copy .env.example to .env.local or .env and update it before signing in.";

export async function loginAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const { t } = await getServerTranslator();

  if (!process.env.DATABASE_URL) {
    return actionError(t(missingDatabaseMessage));
  }

  const values = Object.fromEntries(formData.entries());
  const parsedValues = loginSchema.safeParse(values);

  if (!parsedValues.success) {
    const errors = getFieldErrors(parsedValues.error);
    return actionError(t(parsedValues.error.errors[0]?.message ?? "Please review the form."), translateActionFields(errors, t, ["email", "password"]));
  }

  const user = await prisma.user.findUnique({
    where: { email: parsedValues.data.email.toLowerCase() },
  });

  if (!user) {
    return actionError(t("We couldn't find an account with that email."));
  }

  const isPasswordValid = await verifyPassword(parsedValues.data.password, user.passwordHash);

  if (!isPasswordValid) {
    return actionError(t("Incorrect email or password."));
  }

  await createSessionCookie({
    userId: user.id,
    role: user.role,
    email: user.email,
  });

  await logActivity(prisma, {
    actorId: user.id,
    entity: ActivityEntity.USER,
    action: ActivityAction.LOGIN,
    entityId: user.id,
    description: t("{name} signed in to the CRM.", { name: user.name }),
  });

  redirect("/dashboard");
}

export async function registerAction(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const { t } = await getServerTranslator();

  if (!process.env.DATABASE_URL) {
    return actionError(t(missingDatabaseMessage));
  }

  const values = Object.fromEntries(formData.entries());
  const parsedValues = registerSchema.safeParse(values);

  if (!parsedValues.success) {
    const errors = getFieldErrors(parsedValues.error);
    return actionError(
      t(parsedValues.error.errors[0]?.message ?? "Please review the form."),
      translateActionFields(errors, t, ["name", "email", "password", "confirmPassword"]),
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsedValues.data.email.toLowerCase() },
  });

  if (existingUser) {
    return actionError(t("An account with that email already exists."), {
      email: t("Use a different email address."),
    });
  }

  const passwordHash = await hashPassword(parsedValues.data.password);

  const user = await prisma.user.create({
    data: {
      name: parsedValues.data.name,
      email: parsedValues.data.email.toLowerCase(),
      passwordHash,
      title: parsedValues.data.title || null,
    },
  });

  await createSessionCookie({
    userId: user.id,
    role: user.role,
    email: user.email,
  });

  await logActivity(prisma, {
    actorId: user.id,
    entity: ActivityEntity.USER,
    action: ActivityAction.REGISTERED,
    entityId: user.id,
    description: t("{name} created a new manager account.", { name: user.name }),
  });

  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSessionCookie();
}

export async function requireAnonymous() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return null;
}
