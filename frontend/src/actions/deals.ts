"use server";

import { revalidatePath } from "next/cache";
import { resolveProvider } from "@backend/common/nest/app-context";
import { validateDto } from "@backend/common/validation/validate-dto";
import { UpsertDealDto } from "@backend/modules/deals/dto/upsert-deal.dto";
import { DealsService } from "@backend/modules/deals/deals.service";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions";
import { actionErrorFromException, toRequestUser } from "@/lib/backend-actions";
import { getServerTranslator } from "@/lib/locale-server";
import { requireUser } from "@/lib/session";

export async function upsertDealAction(prevState: ActionResult, formData: FormData) {
  const { t } = await getServerTranslator();
  const user = await requireUser();

  try {
    const dto = await validateDto(UpsertDealDto, Object.fromEntries(formData.entries()));
    const dealsService = await resolveProvider(DealsService);
    await dealsService.upsertDeal(toRequestUser(user), dto);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/deals");
    revalidatePath("/dashboard/promo-codes");
    revalidatePath("/dashboard/analytics");
    if (dto.clientId) {
      revalidatePath(`/dashboard/clients/${dto.clientId}`);
    }

    return actionSuccess(t(dto.id ? "Deal updated." : "Deal created."));
  } catch (error) {
    const response = actionErrorFromException(error, t, {
      title: ["deal title"],
      grossAmount: ["amount", "gross"],
      clientId: ["client"],
      leadId: ["lead"],
      ownerId: ["owner"],
      promoCode: ["promo code"],
    });

    return actionError(response.message, response.fields);
  }
}
