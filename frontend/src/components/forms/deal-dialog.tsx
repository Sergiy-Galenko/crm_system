"use client";

import * as React from "react";
import { useActionState } from "react";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { upsertDealAction } from "@/actions/deals";
import { ActionDialog } from "@/components/form/action-dialog";
import { FormField } from "@/components/form/form-field";
import { SubmitButton } from "@/components/form/submit-button";
import { useLocale } from "@/components/providers/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { idleActionState } from "@/lib/actions";
import { dealStages } from "@/lib/constants";
import { formatCurrency, toDateInputValue } from "@/lib/utils";

type PromoPreview =
  | {
      valid: true;
      message: string;
      discountAmount: number;
      finalAmount: number;
      code: string;
      type: string;
      value: number;
    }
  | {
      valid: false;
      message: string;
    }
  | null;

export function DealDialog({
  users,
  clients,
  leads,
  deal,
  triggerLabel = "New deal",
}: {
  users: Array<{ id: string; name: string }>;
  clients: Array<{ id: string; company: string }>;
  leads: Array<{ id: string; company: string }>;
  deal?: {
    id: string;
    title: string;
    description?: string | null;
    stage: string;
    currency: string;
    grossAmount: number;
    closeDate?: Date | null;
    clientId: string;
    leadId?: string | null;
    ownerId: string;
    promoCode?: string | null;
  };
  triggerLabel?: string;
}) {
  const [state, formAction] = useActionState(upsertDealAction, idleActionState);
  const { locale, t } = useLocale();
  const [promoCode, setPromoCode] = React.useState(deal?.promoCode ?? "");
  const [grossAmount, setGrossAmount] = React.useState(String(deal?.grossAmount ?? ""));
  const [promoPreview, setPromoPreview] = React.useState<PromoPreview>(null);
  const [isCheckingPromo, setIsCheckingPromo] = React.useState(false);

  React.useEffect(() => {
    if (state.fields?.promoCode) {
      setPromoPreview({
        valid: false,
        message: state.fields.promoCode,
      });
    }
  }, [state]);

  const validatePromo = async () => {
    if (!promoCode.trim() || !grossAmount) {
      setPromoPreview({
        valid: false,
        message: t("Enter the deal amount and promo code to validate it."),
      });
      return;
    }

    setIsCheckingPromo(true);

    try {
      const response = await fetch("/api/promo-codes/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: promoCode,
          amount: Number(grossAmount),
        }),
      });

      const payload = (await response.json()) as {
        success: boolean;
        message: string;
        data?: {
          code: string;
          discountAmount: number;
          finalAmount: number;
          type: string;
          value: number;
        };
      };

      if (!payload.success || !payload.data) {
        setPromoPreview({
          valid: false,
          message: payload.message,
        });
        return;
      }

      setPromoPreview({
        valid: true,
        message: payload.message,
        ...payload.data,
      });
    } catch {
      setPromoPreview({
        valid: false,
        message: t("Unable to validate the promo code right now."),
      });
    } finally {
      setIsCheckingPromo(false);
    }
  };

  return (
    <ActionDialog
      trigger={<Button variant={deal ? "secondary" : "primary"}>{t(triggerLabel)}</Button>}
      title={t(deal ? "Edit deal" : "Create deal")}
      description={t("Keep discount logic server-authoritative and apply promo codes only after backend validation.")}
      state={state}
      contentClassName="max-w-xl p-5 sm:p-6"
    >
      {() => (
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="id" value={deal?.id ?? ""} />
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label={t("Deal title")} error={state.fields?.title} className="md:col-span-2">
              <Input name="title" defaultValue={deal?.title} />
            </FormField>
            <FormField label={t("Stage")}>
              <Select name="stage" defaultValue={deal?.stage ?? "DISCOVERY"}>
                {dealStages.map((stage) => (
                  <option key={stage} value={stage}>
                    {t(stage)}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label={t("Currency")}>
              <Input name="currency" maxLength={3} defaultValue={deal?.currency ?? "USD"} />
            </FormField>
            <FormField label={t("Gross amount")} error={state.fields?.grossAmount}>
              <Input
                name="grossAmount"
                type="number"
                min="0"
                step="0.01"
                defaultValue={deal?.grossAmount ?? ""}
                onChange={(event) => {
                  setGrossAmount(event.target.value);
                  setPromoPreview(null);
                }}
              />
            </FormField>
            <FormField label={t("Expected close date")}>
              <Input name="closeDate" type="date" defaultValue={toDateInputValue(deal?.closeDate)} />
            </FormField>
            <FormField label={t("Client")} error={state.fields?.clientId}>
              <Select name="clientId" defaultValue={deal?.clientId ?? clients[0]?.id}>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.company}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label={t("Lead")} error={state.fields?.leadId}>
              <Select name="leadId" defaultValue={deal?.leadId ?? ""}>
                <option value="">{t("Not linked")}</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.company}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label={t("Owner")} error={state.fields?.ownerId}>
              <Select name="ownerId" defaultValue={deal?.ownerId ?? users[0]?.id}>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label={t("Promo code")} error={state.fields?.promoCode} className="md:col-span-2">
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <Input
                  name="promoCode"
                  placeholder={t("Promo code")}
                  defaultValue={deal?.promoCode ?? ""}
                  onChange={(event) => {
                    setPromoCode(event.target.value);
                    setPromoPreview(null);
                  }}
                />
                <Button type="button" variant="secondary" onClick={validatePromo} disabled={isCheckingPromo}>
                  {isCheckingPromo ? t("Checking...") : t("Validate code")}
                </Button>
              </div>
              {promoPreview ? (
                promoPreview.valid ? (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
                    <div className="flex items-center gap-2 font-medium">
                      <CheckCircle2 className="h-4 w-4" />
                      {t("Promo code valid")}
                    </div>
                    <p className="mt-2">
                      {t("{code} applies {discount} off.", {
                        code: promoPreview.code,
                        discount:
                          promoPreview.type === "PERCENT"
                            ? `${promoPreview.value}%`
                            : formatCurrency(promoPreview.value, "USD", locale),
                      })}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge variant="success">
                        {t("Discount {amount}", { amount: formatCurrency(promoPreview.discountAmount, "USD", locale) })}
                      </Badge>
                      <Badge variant="info">{t("Net {amount}", { amount: formatCurrency(promoPreview.finalAmount, "USD", locale) })}</Badge>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-600">
                    <div className="flex items-center gap-2 font-medium">
                      <CircleAlert className="h-4 w-4" />
                      {promoPreview.message}
                    </div>
                  </div>
                )
              ) : null}
            </FormField>
            <FormField label={t("Description")} className="md:col-span-2">
              <Textarea name="description" defaultValue={deal?.description ?? ""} />
            </FormField>
          </div>
          <div className="flex justify-end">
            <SubmitButton>{t(deal ? "Save changes" : "Create deal")}</SubmitButton>
          </div>
        </form>
      )}
    </ActionDialog>
  );
}
