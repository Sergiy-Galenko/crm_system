"use server";

import { revalidatePath } from "next/cache";
import { resolveProvider } from "@backend/common/nest/app-context";
import { validateDto } from "@backend/common/validation/validate-dto";
import { UpsertUserDto } from "@backend/modules/users/dto/upsert-user.dto";
import { UpdateSettingsDto } from "@backend/modules/users/dto/update-settings.dto";
import { UsersService } from "@backend/modules/users/users.service";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions";
import { actionErrorFromException, toRequestUser } from "@/lib/backend-actions";
import { getServerTranslator } from "@/lib/locale-server";
import { requireUser } from "@/lib/session";

export async function upsertUserAction(prevState: ActionResult, formData: FormData) {
  const { t } = await getServerTranslator();
  const user = await requireUser();

  try {
    const dto = await validateDto(UpsertUserDto, Object.fromEntries(formData.entries()));
    const usersService = await resolveProvider(UsersService);
    await usersService.upsertUser(toRequestUser(user), dto);

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/clients");
    revalidatePath("/dashboard/leads");
    revalidatePath("/dashboard/deals");

    return actionSuccess(t(dto.id ? "User updated." : "User created."));
  } catch (error) {
    const response = actionErrorFromException(error, t, {
      name: ["name"],
      email: ["email"],
      roleLabel: ["role"],
      password: ["password"],
      role: ["role"],
    });

    return actionError(response.message, response.fields);
  }
}

export async function updateSettingsAction(prevState: ActionResult, formData: FormData) {
  const { t } = await getServerTranslator();
  const user = await requireUser();

  try {
    const dto = await validateDto(UpdateSettingsDto, Object.fromEntries(formData.entries()));
    const usersService = await resolveProvider(UsersService);
    await usersService.updateSettings(toRequestUser(user), dto);

    revalidatePath("/dashboard", "layout");
    revalidatePath("/dashboard/settings");

    return actionSuccess(t("Settings updated."));
  } catch (error) {
    const response = actionErrorFromException(error, t, {
      name: ["name"],
      title: ["title"],
      statusMessage: ["status"],
      phone: ["phone"],
      location: ["location"],
      bio: ["bio"],
      companyLogoUrl: ["logo"],
      avatarColor: ["color"],
    });

    return actionError(response.message, response.fields);
  }
}
