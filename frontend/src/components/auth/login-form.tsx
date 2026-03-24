"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/actions/auth";
import { useLocale } from "@/components/providers/locale-provider";
import { FormField } from "@/components/form/form-field";
import { SubmitButton } from "@/components/form/submit-button";
import { Input } from "@/components/ui/input";
import { idleActionState } from "@/lib/actions";

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, idleActionState);
  const { t } = useLocale();

  return (
    <form action={formAction} className="mt-8 grid gap-5">
      <FormField label={t("Work email")} error={state.fields?.email}>
        <Input name="email" type="email" placeholder="name@company.com" />
      </FormField>
      <FormField label={t("Password")} error={state.fields?.password}>
        <Input name="password" type="password" placeholder={t("Enter your password")} />
      </FormField>
      {state.message && !state.success ? <p className="text-sm text-rose-500">{state.message}</p> : null}
      <SubmitButton className="w-full">{t("Sign in")}</SubmitButton>
      <p className="text-sm text-slate-500">
        {t("Need an account?")}{" "}
        <Link href="/register" className="font-medium text-slate-950">
          {t("Create one")}
        </Link>
      </p>
    </form>
  );
}
