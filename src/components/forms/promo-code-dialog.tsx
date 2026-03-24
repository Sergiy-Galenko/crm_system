"use client";

import { useActionState } from "react";
import { upsertPromoCodeAction } from "@/actions/promo-codes";
import { ActionDialog } from "@/components/form/action-dialog";
import { FormField } from "@/components/form/form-field";
import { SubmitButton } from "@/components/form/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { idleActionState } from "@/lib/actions";
import { discountTypes } from "@/lib/constants";
import { toDateInputValue } from "@/lib/utils";

export function PromoCodeDialog({
  promoCode,
  triggerLabel = "New promo code",
}: {
  promoCode?: {
    id: string;
    code: string;
    description?: string | null;
    active: boolean;
    expiresAt?: Date | null;
    usageLimit?: number | null;
    discountType: string;
    discountValue: number;
  };
  triggerLabel?: string;
}) {
  const [state, formAction] = useActionState(upsertPromoCodeAction, idleActionState);

  return (
    <ActionDialog
      trigger={<Button variant={promoCode ? "secondary" : "primary"}>{triggerLabel}</Button>}
      title={promoCode ? "Edit promo code" : "Create promo code"}
      description="Set activity state, discount rules, expiration, and overall usage caps."
      state={state}
    >
      {() => (
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="id" value={promoCode?.id ?? ""} />
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Code" error={state.fields?.code}>
              <Input name="code" defaultValue={promoCode?.code} />
            </FormField>
            <FormField label="Active">
              <Select name="active" defaultValue={promoCode ? String(promoCode.active) : "true"}>
                <option value="true">Active</option>
                <option value="false">Disabled</option>
              </Select>
            </FormField>
            <FormField label="Discount type">
              <Select name="discountType" defaultValue={promoCode?.discountType ?? "PERCENT"}>
                {discountTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Discount value" error={state.fields?.discountValue}>
              <Input name="discountValue" type="number" min="0" step="0.01" defaultValue={promoCode?.discountValue ?? ""} />
            </FormField>
            <FormField label="Expiration date">
              <Input name="expiresAt" type="date" defaultValue={toDateInputValue(promoCode?.expiresAt)} />
            </FormField>
            <FormField label="Usage limit" error={state.fields?.usageLimit}>
              <Input name="usageLimit" type="number" min="1" step="1" defaultValue={promoCode?.usageLimit ?? ""} />
            </FormField>
            <FormField label="Description" className="md:col-span-2">
              <Textarea name="description" defaultValue={promoCode?.description ?? ""} />
            </FormField>
          </div>
          <div className="flex justify-end">
            <SubmitButton>{promoCode ? "Save changes" : "Create promo code"}</SubmitButton>
          </div>
        </form>
      )}
    </ActionDialog>
  );
}
