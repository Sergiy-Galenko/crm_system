"use server";

import { revalidatePath } from "next/cache";
import { resolveProvider } from "@backend/common/nest/app-context";
import { validateDto } from "@backend/common/validation/validate-dto";
import { UpsertPromoCodeDto } from "@backend/modules/promo-codes/dto/upsert-promo-code.dto";
import { PromoCodesService } from "@backend/modules/promo-codes/promo-codes.service";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions";
import { actionErrorFromException, toRequestUser } from "@/lib/backend-actions";
import { getServerTranslator } from "@/lib/locale-server";
import { requireUser } from "@/lib/session";

export async function upsertPromoCodeAction(prevState: ActionResult, formData: FormData) {
  const { t } = await getServerTranslator();
  const user = await requireUser();

  try {
    const dto = await validateDto(UpsertPromoCodeDto, Object.fromEntries(formData.entries()));
    const promoCodesService = await resolveProvider(PromoCodesService);
    await promoCodesService.upsertPromoCode(toRequestUser(user), dto);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/deals");
    revalidatePath("/dashboard/promo-codes");
    revalidatePath("/dashboard/analytics");

    return actionSuccess(t(dto.id ? "Promo code updated." : "Promo code created."));
  } catch (error) {
    const response = actionErrorFromException(error, t, {
      code: ["code", "promo code"],
      discountValue: ["discount"],
      usageLimit: ["usage"],
    });

    return actionError(response.message, response.fields);
  }
}
