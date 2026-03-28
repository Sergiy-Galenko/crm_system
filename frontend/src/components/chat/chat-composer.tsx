"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { sendMessageAction } from "@/actions/chat";
import { SubmitButton } from "@/components/form/submit-button";
import { useLocale } from "@/components/providers/locale-provider";
import { Textarea } from "@/components/ui/textarea";
import { idleActionState } from "@/lib/actions";

export function ChatComposer({ conversationId }: { conversationId: string }) {
  const [state, formAction] = useActionState(sendMessageAction, idleActionState);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const { t } = useLocale();

  useEffect(() => {
    if (!state.success) {
      return;
    }

    formRef.current?.reset();
    router.refresh();
  }, [router, state]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-3">
      <input type="hidden" name="conversationId" value={conversationId} />
      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-800">{t("Message")}</span>
        <Textarea
          name="body"
          placeholder={t("Type your message...")}
          className="min-h-28 bg-white"
        />
      </label>
      {state.fields?.body ? <p className="text-xs font-medium text-rose-500">{state.fields.body}</p> : null}
      <div className="flex justify-end">
        <SubmitButton>{t("Send")}</SubmitButton>
      </div>
    </form>
  );
}
