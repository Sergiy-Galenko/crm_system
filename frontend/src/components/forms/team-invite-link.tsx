"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Link2, Copy } from "lucide-react";
import { generateTeamInviteAction } from "@/actions/users";
import { useLocale } from "@/components/providers/locale-provider";
import { SubmitButton } from "@/components/form/submit-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { ActionResult } from "@/lib/actions";

const initialState: ActionResult<{ inviteLink: string } | undefined> = {
  success: false,
  message: "",
};

export function TeamInviteLink() {
  const [state, formAction] = useActionState(generateTeamInviteAction, initialState);
  const [open, setOpen] = useState(false);
  const { t } = useLocale();
  const inviteLink = state.data?.inviteLink ?? "";

  useEffect(() => {
    if (!state.success || !inviteLink || !navigator.clipboard) {
      return;
    }

    void navigator.clipboard.writeText(inviteLink).then(
      () => toast.success(t("Invite link copied.")),
      () => undefined,
    );
  }, [inviteLink, state, t]);

  function handleCopyInviteLink() {
    if (!inviteLink || !navigator.clipboard) {
      return;
    }

    void navigator.clipboard.writeText(inviteLink).then(
      () => toast.success(t("Invite link copied.")),
      () => toast.error(t("Something went wrong.")),
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Link2 className="h-4 w-4" />
          {t("Invite teammate")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("Invite teammate")}</DialogTitle>
          <DialogDescription>
            {t("Generate a private join link so a new teammate can register directly into your workspace.")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <form action={formAction} className="flex justify-start">
            <SubmitButton variant="secondary">
              <Link2 className="h-4 w-4" />
              {t("Generate join link")}
            </SubmitButton>
          </form>

          {inviteLink ? (
            <div className="grid gap-2">
              <p className="text-sm font-medium text-slate-800">{t("Share this link with your teammate")}</p>
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <Input value={inviteLink} readOnly className="min-w-0" />
                <Button type="button" variant="secondary" onClick={handleCopyInviteLink}>
                  <Copy className="h-4 w-4" />
                  {t("Copy link")}
                </Button>
              </div>
            </div>
          ) : null}

          {state.message && !state.success ? <p className="text-sm text-rose-500">{state.message}</p> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
