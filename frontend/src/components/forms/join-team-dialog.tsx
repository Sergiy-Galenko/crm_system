"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AtSign, Link2, UserPlus } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { joinTeamAction } from "@/actions/users";
import { FormField } from "@/components/form/form-field";
import { SubmitButton } from "@/components/form/submit-button";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { idleActionState } from "@/lib/actions";
import { cn } from "@/lib/utils";

type JoinMode = "invite" | "nickname";

export function JoinTeamDialog({ prefilledInviteValue = "" }: { prefilledInviteValue?: string }) {
  const [state, setState] = useState(idleActionState);
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const requiresInviteConfirmation = Boolean(prefilledInviteValue);
  const [open, setOpen] = useState(requiresInviteConfirmation);
  const [mode, setMode] = useState<JoinMode>(requiresInviteConfirmation ? "invite" : "nickname");
  const [inviteValue, setInviteValue] = useState(prefilledInviteValue);
  const [nickname, setNickname] = useState("");
  const [inviteConfirmed, setInviteConfirmed] = useState(!requiresInviteConfirmation);
  const [sliderValue, setSliderValue] = useState(0);

  function clearInviteParamIfNeeded() {
    if (!prefilledInviteValue) {
      return;
    }

    router.replace(pathname);
  }

  function handleClose() {
    setOpen(false);
    clearInviteParamIfNeeded();
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      clearInviteParamIfNeeded();
    }
  }

  function unlockInvite() {
    setInviteConfirmed(true);
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

  async function handleJoin(formData: FormData) {
    const nextState = await joinTeamAction(idleActionState, formData);
    setState(nextState);

    if (!nextState.message) {
      return;
    }

    if (!nextState.success) {
      toast.error(nextState.message);
      return;
    }

    toast.success(nextState.message);
    setOpen(false);

    if (prefilledInviteValue) {
      router.replace(pathname);
      return;
    }

    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <UserPlus className="h-4 w-4" />
          {t("Join team")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("Join team")}</DialogTitle>
          <DialogDescription>
            {t("Use an invite link or teammate nickname to connect this account to a workspace.")}
          </DialogDescription>
        </DialogHeader>

        {requiresInviteConfirmation && !inviteConfirmed ? (
          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-950">{t("Do you want to join this team?")}</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {t("Use the slider to confirm that you want to join this workspace.")}
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
                {t("Not now")}
              </Button>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-800">{t("Slide to join the team")}</p>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                  {sliderValue}%
                </span>
              </div>
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
                className={cn("mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-950")}
              />
            </div>
          </div>
        ) : null}

        <form action={handleJoin} className="grid gap-4">
          <Tabs value={mode} onValueChange={(value) => setMode(value as JoinMode)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="nickname">{t("Teammate nickname")}</TabsTrigger>
              <TabsTrigger value="invite">{t("Invite link")}</TabsTrigger>
            </TabsList>

            <TabsContent value="nickname" className="mt-4">
              <FormField
                label={t("Teammate nickname")}
                error={state.fields?.nickname}
                description={t("Type a nickname like @olivia")}
              >
                <div className="relative">
                  <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    name="nickname"
                    value={nickname}
                    onChange={(event) => setNickname(event.target.value)}
                    placeholder="olivia"
                    className="pl-10"
                    disabled={requiresInviteConfirmation && !inviteConfirmed}
                  />
                </div>
              </FormField>
              <input type="hidden" name="inviteValue" value="" />
            </TabsContent>

            <TabsContent value="invite" className="mt-4">
              <FormField
                label={t("Invite link")}
                error={state.fields?.inviteValue}
                description={t("Paste a full invite link or the raw invite token.")}
              >
                <div className="relative">
                  <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    name="inviteValue"
                    value={inviteValue}
                    onChange={(event) => setInviteValue(event.target.value)}
                    placeholder={t("https://your-crm.com/register?invite=...")}
                    className="pl-10"
                    disabled={requiresInviteConfirmation && !inviteConfirmed}
                  />
                </div>
              </FormField>
              <input type="hidden" name="nickname" value="" />
            </TabsContent>
          </Tabs>

          {state.message && !state.success ? <p className="text-sm text-rose-500">{state.message}</p> : null}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={handleClose}>
              {t("Cancel")}
            </Button>
            <SubmitButton disabled={requiresInviteConfirmation && !inviteConfirmed}>
              {t("Join workspace")}
            </SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
