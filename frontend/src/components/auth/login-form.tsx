"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/actions/auth";
import { useLocale } from "@/components/providers/locale-provider";
import { FormField } from "@/components/form/form-field";
import { SubmitButton } from "@/components/form/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { idleActionState } from "@/lib/actions";

export function LoginForm({ inviteToken = "" }: { inviteToken?: string }) {
  const [state, formAction] = useActionState(loginAction, idleActionState);
  const { t } = useLocale();

  return (
    <form action={formAction} className="mt-8 grid gap-5">
      <input type="hidden" name="inviteToken" value={inviteToken} />
      <FormField label={t("Work email")} error={state.fields?.email}>
        <Input name="email" type="email" placeholder="name@company.com" />
      </FormField>
      <FormField label={t("Password")} error={state.fields?.password}>
        <Input name="password" type="password" placeholder={t("Enter your password")} />
      </FormField>
      {state.message && !state.success ? <p className="text-sm text-rose-500">{state.message}</p> : null}
      <SubmitButton className="w-full">{t("Sign in")}</SubmitButton>
      <Button asChild type="button" variant="secondary" className="w-full">
        <Link href={inviteToken ? `/register?invite=${encodeURIComponent(inviteToken)}` : "/register"}>
          {t("Create one")}
        </Link>
      </Button>
    </form>
  );
}
