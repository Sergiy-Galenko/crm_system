"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { resolveProvider } from "@backend/common/nest/app-context";
import { validateDto } from "@backend/common/validation/validate-dto";
import { JoinTeamDto } from "@backend/modules/users/dto/join-team.dto";
import { UpsertUserDto } from "@backend/modules/users/dto/upsert-user.dto";
import { UpdateSettingsDto } from "@backend/modules/users/dto/update-settings.dto";
import { UsersService } from "@backend/modules/users/users.service";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions";
import { actionErrorFromException, toRequestUser } from "@/lib/backend-actions";
import { getServerTranslator } from "@/lib/locale-server";
import { requireUser } from "@/lib/session";

function getRequestOriginFromHeaders(headerStore: Awaited<ReturnType<typeof headers>>) {
  const forwardedHost = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const forwardedProto =
    headerStore.get("x-forwarded-proto") ??
    headerStore.get("origin")?.split("://")[0] ??
    (forwardedHost?.includes("localhost") ? "http" : "https");

  return forwardedHost ? `${forwardedProto}://${forwardedHost}` : "http://localhost:3000";
}

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
      nickname: ["nickname"],
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
      nickname: ["nickname"],
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

export async function generateTeamInviteAction(
  prevState: ActionResult<{ inviteLink: string } | undefined>,
  formData: FormData,
): Promise<ActionResult<{ inviteLink: string } | undefined>> {
  void prevState;
  void formData;
  const { t } = await getServerTranslator();
  const user = await requireUser();

  try {
    const usersService = await resolveProvider(UsersService);
    const token = await usersService.createTeamInvite(toRequestUser(user));
    const headerStore = await headers();
    const origin = getRequestOriginFromHeaders(headerStore);
    const inviteLink = `${origin}/register?invite=${encodeURIComponent(token)}`;

    return actionSuccess(t("Invite link ready."), { inviteLink });
  } catch (error) {
    const response = actionErrorFromException(error, t);
    return actionError(response.message);
  }
}

export async function joinTeamAction(prevState: ActionResult, formData: FormData) {
  void prevState;
  const { t } = await getServerTranslator();
  const user = await requireUser();

  try {
    const dto = await validateDto(JoinTeamDto, Object.fromEntries(formData.entries()));
    const usersService = await resolveProvider(UsersService);
    await usersService.joinTeam(toRequestUser(user), dto);

    revalidatePath("/dashboard", "layout");
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/chat");

    return actionSuccess(t("You joined the team."));
  } catch (error) {
    const response = actionErrorFromException(error, t, {
      inviteValue: ["invite"],
      nickname: ["nickname"],
    });

    return actionError(response.message, response.fields);
  }
}
