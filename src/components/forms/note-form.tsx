"use client";

import { useActionState } from "react";
import { createNoteAction } from "@/actions/clients";
import { FormField } from "@/components/form/form-field";
import { SubmitButton } from "@/components/form/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { idleActionState } from "@/lib/actions";

export function NoteForm({
  clientId,
  leadId,
  dealId,
}: {
  clientId?: string;
  leadId?: string;
  dealId?: string;
}) {
  const [state, formAction] = useActionState(createNoteAction, idleActionState);

  return (
    <form action={formAction} className="card rounded-[2rem] p-5">
      <input type="hidden" name="clientId" value={clientId ?? ""} />
      <input type="hidden" name="leadId" value={leadId ?? ""} />
      <input type="hidden" name="dealId" value={dealId ?? ""} />
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">Notes</h3>
          <p className="mt-1 text-sm text-slate-500">Add context for the next handoff or follow-up.</p>
        </div>
      </div>
      <FormField label="New note" error={state.message && !state.success ? state.message : undefined} className="mt-5">
        <Textarea name="body" placeholder="Capture context, blockers, objections, or onboarding details." />
      </FormField>
      <div className="mt-4 flex justify-end">
        <SubmitButton>Add note</SubmitButton>
      </div>
    </form>
  );
}
