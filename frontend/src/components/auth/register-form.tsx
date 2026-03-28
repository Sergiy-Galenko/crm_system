"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerAction } from "@/actions/auth";
import { useLocale } from "@/components/providers/locale-provider";
import { FormField } from "@/components/form/form-field";
import { SubmitButton } from "@/components/form/submit-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { idleActionState } from "@/lib/actions";
import { cn } from "@/lib/utils";

export function RegisterForm({ inviteToken = "" }: { inviteToken?: string }) {
  const [state, formAction] = useActionState(registerAction, idleActionState);
  const router = useRouter();
  const { t } = useLocale();
  const requiresInviteConfirmation = Boolean(inviteToken);
  const [inviteConfirmed, setInviteConfirmed] = useState(!requiresInviteConfirmation);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(requiresInviteConfirmation);
  const [sliderValue, setSliderValue] = useState(0);

  function handleDialogOpenChange(nextOpen: boolean) {
    setInviteDialogOpen(inviteConfirmed ? nextOpen : true);
  }

  function unlockInvite() {
    setInviteConfirmed(true);
    setInviteDialogOpen(false);
    setSliderValue(100);
  }

  function handleSliderReset() {
    if (!inviteConfirmed && sliderValue < 100) {
      setSliderValue(0);
    }
  }

  function handleSliderChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextValue = Number(event.target.value);
    setSliderValue(nextValue);

    if (nextValue >= 100) {
      unlockInvite();
    }
  }

  return (
    <>
      {requiresInviteConfirmation ? (
        <Dialog open={inviteDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogContent
            className="max-w-lg"
            onEscapeKeyDown={(event) => {
              if (!inviteConfirmed) {
                event.preventDefault();
              }
            }}
            onPointerDownOutside={(event) => {
              if (!inviteConfirmed) {
                event.preventDefault();
              }
            }}
          >
            <DialogHeader>
              <DialogTitle>{t("Do you want to join this team?")}</DialogTitle>
              <DialogDescription>
                {t("Use the slider to confirm that you want to join this workspace.")}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4">
              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-950">{t("Slide to join the team")}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {t("Move the control all the way to the end to unlock registration.")}
                    </p>
                  </div>
                  <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                    {sliderValue}%
                  </div>
                </div>
                <div className="mt-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={sliderValue}
                    onChange={handleSliderChange}
                    onMouseUp={handleSliderReset}
                    onTouchEnd={handleSliderReset}
                    onBlur={handleSliderReset}
                    aria-label={t("Slide to join the team")}
                    className={cn("h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-950")}
                  />
                </div>
              </div>

              <div className="flex justify-between gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    router.replace("/login");
                  }}
                >
                  {t("Not now")}
                </Button>
                <p className="text-sm text-slate-500">{t("Yes is confirmed only after the full swipe.")}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}

      <form action={formAction} className="mt-8 grid gap-5">
        <input type="hidden" name="inviteToken" value={inviteToken} />
        {requiresInviteConfirmation && inviteConfirmed ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {t("Invite confirmed. Finish creating your account to join the workspace.")}
          </div>
        ) : null}
        <FormField label={t("Full name")} error={state.fields?.name}>
          <Input name="name" placeholder="Avery Carter" disabled={!inviteConfirmed} />
        </FormField>
        <FormField label={t("Title")}>
          <Input name="title" placeholder={t("Sales Operations Manager")} disabled={!inviteConfirmed} />
        </FormField>
        <FormField
          label={t("Nickname")}
          error={state.fields?.nickname}
          description={t("Create your nickname now so teammates can find you later.")}
        >
          <Input name="nickname" placeholder="olivia" disabled={!inviteConfirmed} />
        </FormField>
        <FormField label={t("Work email")} error={state.fields?.email}>
          <Input name="email" type="email" placeholder="avery@company.com" disabled={!inviteConfirmed} />
        </FormField>
        <FormField label={t("Password")} error={state.fields?.password}>
          <Input name="password" type="password" placeholder={t("Create a secure password")} disabled={!inviteConfirmed} />
        </FormField>
        <FormField label={t("Confirm password")} error={state.fields?.confirmPassword}>
          <Input name="confirmPassword" type="password" placeholder={t("Repeat the password")} disabled={!inviteConfirmed} />
        </FormField>
        {state.message && !state.success ? <p className="text-sm text-rose-500">{state.message}</p> : null}
        <SubmitButton className="w-full" disabled={!inviteConfirmed}>{t("Create account")}</SubmitButton>
        <p className="text-sm text-slate-500">
          {t("Already have an account?")}{" "}
          <Link href={inviteToken ? `/login?invite=${encodeURIComponent(inviteToken)}` : "/login"} className="font-medium text-slate-950">
            {t("Sign in")}
          </Link>
        </p>
      </form>
    </>
  );
}
