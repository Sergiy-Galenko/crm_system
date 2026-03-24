"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "@/actions/auth";
import { FormField } from "@/components/form/form-field";
import { SubmitButton } from "@/components/form/submit-button";
import { Input } from "@/components/ui/input";
import { idleActionState } from "@/lib/actions";

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, idleActionState);

  return (
    <form action={formAction} className="mt-8 grid gap-5">
      <FormField label="Full name" error={state.fields?.name}>
        <Input name="name" placeholder="Avery Carter" />
      </FormField>
      <FormField label="Title">
        <Input name="title" placeholder="Sales Operations Manager" />
      </FormField>
      <FormField label="Work email" error={state.fields?.email}>
        <Input name="email" type="email" placeholder="avery@company.com" />
      </FormField>
      <FormField label="Password" error={state.fields?.password}>
        <Input name="password" type="password" placeholder="Create a secure password" />
      </FormField>
      <FormField label="Confirm password" error={state.fields?.confirmPassword}>
        <Input name="confirmPassword" type="password" placeholder="Repeat the password" />
      </FormField>
      {state.message && !state.success ? <p className="text-sm text-rose-500">{state.message}</p> : null}
      <SubmitButton className="w-full">Create account</SubmitButton>
      <p className="text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-slate-950">
          Sign in
        </Link>
      </p>
    </form>
  );
}
