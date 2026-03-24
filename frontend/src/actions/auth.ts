"use server";

import { redirect } from "next/navigation";
import { resolveProvider } from "@backend/common/nest/app-context";
import { validateDto } from "@backend/common/validation/validate-dto";
import { AuthService } from "@backend/modules/auth/auth.service";
import { LoginDto } from "@backend/modules/auth/dto/login.dto";
import { RegisterDto } from "@backend/modules/auth/dto/register.dto";
import { actionError, type ActionResult } from "@/lib/actions";
import { actionErrorFromException } from "@/lib/backend-actions";
import { getServerTranslator } from "@/lib/locale-server";
import { clearSessionCookie, createSessionCookie, getCurrentUser } from "@/lib/session";

export async function loginAction(prevState: ActionResult, formData: FormData) {
  const { t } = await getServerTranslator();

  try {
    const dto = await validateDto(LoginDto, Object.fromEntries(formData.entries()));
    const authService = await resolveProvider(AuthService);
    const user = await authService.login(dto);

    await createSessionCookie({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    redirect("/dashboard");
  } catch (error) {
    const response = actionErrorFromException(error, t, {
      email: ["email"],
      password: ["password"],
    });

    return actionError(response.message, response.fields);
  }
}

export async function registerAction(prevState: ActionResult, formData: FormData) {
  const { t } = await getServerTranslator();

  try {
    const dto = await validateDto(RegisterDto, Object.fromEntries(formData.entries()));

    if (dto.password !== dto.confirmPassword) {
      return actionError(t("Passwords do not match."), {
        confirmPassword: t("Passwords do not match."),
      });
    }

    const authService = await resolveProvider(AuthService);
    const user = await authService.register(dto);

    await createSessionCookie({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    redirect("/dashboard");
  } catch (error) {
    const response = actionErrorFromException(error, t, {
      name: ["name"],
      email: ["email"],
      password: ["password"],
      confirmPassword: ["confirm password"],
    });

    return actionError(response.message, response.fields);
  }
}

export async function logoutAction() {
  await clearSessionCookie();
}

export async function requireAnonymous() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return null;
}
