"use server";

import { revalidatePath } from "next/cache";
import { resolveProvider } from "@backend/common/nest/app-context";
import { validateDto } from "@backend/common/validation/validate-dto";
import { ClientsService } from "@backend/modules/clients/clients.service";
import { CreateNoteDto } from "@backend/modules/clients/dto/create-note.dto";
import { UpsertClientDto } from "@backend/modules/clients/dto/upsert-client.dto";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions";
import { actionErrorFromException, toRequestUser } from "@/lib/backend-actions";
import { getServerTranslator } from "@/lib/locale-server";
import { requireUser } from "@/lib/session";

export async function upsertClientAction(prevState: ActionResult, formData: FormData) {
  const { t } = await getServerTranslator();
  const user = await requireUser();

  try {
    const dto = await validateDto(UpsertClientDto, Object.fromEntries(formData.entries()));
    const clientsService = await resolveProvider(ClientsService);
    const client = await clientsService.upsertClient(toRequestUser(user), dto);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clients");
    revalidatePath(`/dashboard/clients/${client.id}`);

    return actionSuccess(t(dto.id ? "Client updated." : "Client created."));
  } catch (error) {
    const response = actionErrorFromException(error, t, {
      name: ["contact name"],
      company: ["company"],
      email: ["email"],
      phone: ["phone"],
      monthlyValue: ["amount", "monthly"],
      ownerId: ["owner"],
    });

    return actionError(response.message, response.fields);
  }
}

export async function createNoteAction(prevState: ActionResult, formData: FormData) {
  const { t } = await getServerTranslator();
  const user = await requireUser();

  try {
    const dto = await validateDto(CreateNoteDto, Object.fromEntries(formData.entries()));
    const clientsService = await resolveProvider(ClientsService);
    await clientsService.createNote(toRequestUser(user), dto);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/clients");
    if (dto.clientId) {
      revalidatePath(`/dashboard/clients/${dto.clientId}`);
    }

    return actionSuccess(t("Note added."));
  } catch (error) {
    const response = actionErrorFromException(error, t, {
      body: ["note"],
      clientId: ["client"],
      leadId: ["lead"],
      dealId: ["deal"],
    });

    return actionError(response.message, response.fields);
  }
}
