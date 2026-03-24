"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/actions/auth";
import { FormField } from "@/components/form/form-field";
import { SubmitButton } from "@/components/form/submit-button";
import { Input } from "@/components/ui/input";
import { idleActionState } from "@/lib/actions";

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, idleActionState);

  return (
    <form action={formAction} className="mt-8 grid gap-5">
      <FormField label="Work email" error={state.fields?.email}>
        <Input name="email" type="email" placeholder="admin@vercelcrm.dev" />
      </FormField>
      <FormField label="Password" error={state.fields?.password}>
        <Input name="password" type="password" placeholder="Enter your password" />
      </FormField>
      {state.message && !state.success ? <p className="text-sm text-rose-500">{state.message}</p> : null}
      <SubmitButton className="w-full">Sign in</SubmitButton>
      <p className="text-sm text-slate-500">
        Need an account?{" "}
        <Link href="/register" className="font-medium text-slate-950">
          Create one
        </Link>
      </p>
    </form>
  );
}
