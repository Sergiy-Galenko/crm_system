"use client";

import { useActionState, useState, useEffect } from "react";
import { verifyAction, resendCodeAction } from "@/actions/auth";
import { useLocale } from "@/components/providers/locale-provider";
import { FormField } from "@/components/form/form-field";
import { SubmitButton } from "@/components/form/submit-button";
import { Input } from "@/components/ui/input";
import { idleActionState } from "@/lib/actions";

export function VerifyForm({ email, inviteToken = "" }: { email: string; inviteToken?: string }) {
  const [state, formAction] = useActionState(verifyAction, idleActionState);
  const [resendState, resendFormAction] = useActionState(resendCodeAction, idleActionState);
  const { t } = useLocale();

  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    if (resendState.success) {
      setCountdown(60); // 60 seconds delay after successful resend
    }
  }, [resendState.success, resendState.message]); // Trigger when resend is successful

  return (
    <div className="mt-8 grid gap-5">
      <form action={formAction} className="grid gap-5">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="inviteToken" value={inviteToken} />
        <FormField label={t("Verification Code")} error={state.fields?.code}>
          <Input name="code" type="text" placeholder="123456" maxLength={6} />
        </FormField>
        
        {state.message && !state.success ? <p className="text-sm text-rose-500">{state.message}</p> : null}
        <SubmitButton className="w-full">{t("Verify and Activate")}</SubmitButton>
      </form>

      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-slate-200"></div>
        <span className="flex-shrink-0 px-3 text-xs text-slate-400 uppercase tracking-widest">{t("or")}</span>
        <div className="flex-grow border-t border-slate-200"></div>
      </div>

      <form action={resendFormAction} className="grid gap-3">
        <input type="hidden" name="email" value={email} />
        {resendState.success && resendState.message ? <p className="text-sm text-emerald-600">{resendState.message}</p> : null}
        {resendState.message && !resendState.success ? <p className="text-sm text-rose-500">{resendState.message}</p> : null}
        
        <SubmitButton variant="outline" className="w-full" disabled={countdown > 0}>
          {countdown > 0 ? `${t("Resend Code in")} ${countdown}s` : t("Resend Code")}
        </SubmitButton>
      </form>
    </div>
  );
}
