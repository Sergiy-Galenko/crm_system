"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "@/actions/auth";
import { useLocale } from "@/components/providers/locale-provider";
import { FormField } from "@/components/form/form-field";
import { SubmitButton } from "@/components/form/submit-button";
import { Input } from "@/components/ui/input";
import { idleActionState } from "@/lib/actions";

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, idleActionState);
  const { t } = useLocale();

  return (
    <form action={formAction} className="mt-8 grid gap-5">
      <FormField label={t("Full name")} error={state.fields?.name}>
        <Input name="name" placeholder="Avery Carter" />
      </FormField>
      <FormField label={t("Title")}>
        <Input name="title" placeholder={t("Sales Operations Manager")} />
      </FormField>
      <FormField label={t("Work email")} error={state.fields?.email}>
        <Input name="email" type="email" placeholder="avery@company.com" />
      </FormField>
      <FormField label={t("Password")} error={state.fields?.password}>
        <Input name="password" type="password" placeholder={t("Create a secure password")} />
      </FormField>
      <FormField label={t("Confirm password")} error={state.fields?.confirmPassword}>
        <Input name="confirmPassword" type="password" placeholder={t("Repeat the password")} />
      </FormField>
      {state.message && !state.success ? <p className="text-sm text-rose-500">{state.message}</p> : null}
      <SubmitButton className="w-full">{t("Create account")}</SubmitButton>
      <p className="text-sm text-slate-500">
        {t("Already have an account?")}{" "}
        <Link href="/login" className="font-medium text-slate-950">
          {t("Sign in")}
        </Link>
      </p>
    </form>
  );
}
