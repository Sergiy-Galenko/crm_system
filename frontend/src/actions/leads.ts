"use server";

import { revalidatePath } from "next/cache";
import { resolveProvider } from "@backend/common/nest/app-context";
import { validateDto } from "@backend/common/validation/validate-dto";
import { UpsertLeadDto } from "@backend/modules/leads/dto/upsert-lead.dto";
import { LeadsService } from "@backend/modules/leads/leads.service";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions";
import { actionErrorFromException, toRequestUser } from "@/lib/backend-actions";
import { getServerTranslator } from "@/lib/locale-server";
import { requireUser } from "@/lib/session";

export async function upsertLeadAction(prevState: ActionResult, formData: FormData) {
  const { t } = await getServerTranslator();
  const user = await requireUser();

  try {
    const dto = await validateDto(UpsertLeadDto, Object.fromEntries(formData.entries()));
    const leadsService = await resolveProvider(LeadsService);
    await leadsService.upsertLead(toRequestUser(user), dto);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/leads");

    return actionSuccess(t(dto.id ? "Lead updated." : "Lead created."));
  } catch (error) {
    const response = actionErrorFromException(error, t, {
      name: ["lead name"],
      company: ["company"],
      email: ["email"],
      estimatedValue: ["amount", "estimated"],
      ownerId: ["owner"],
      clientId: ["client"],
    });

    return actionError(response.message, response.fields);
  }
}
