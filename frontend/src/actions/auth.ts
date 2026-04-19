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
  const inviteToken = String(formData.get("inviteToken") ?? "").trim();

  try {
    const dto = await validateDto(LoginDto, Object.fromEntries(formData.entries()));
    const authService = await resolveProvider(AuthService);
    const user = await authService.login(dto);

    await createSessionCookie({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    redirect(inviteToken ? `/dashboard/settings?invite=${encodeURIComponent(inviteToken)}` : "/dashboard");
  } catch (error: any) {
    if (error?.response?.message === "ACCOUNT_NOT_VERIFIED" || error?.message === "ACCOUNT_NOT_VERIFIED") {
      const email = String(formData.get("email") ?? "").trim();
      redirect(`/verify?email=${encodeURIComponent(email)}${inviteToken ? `&invite=${encodeURIComponent(inviteToken)}` : ""}`);
    }

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

    const inviteToken = String(formData.get("inviteToken") ?? "").trim();
    redirect(`/verify?email=${encodeURIComponent(user.email)}${inviteToken ? `&invite=${encodeURIComponent(inviteToken)}` : ""}`);
  } catch (error) {
    const response = actionErrorFromException(error, t, {
      name: ["name"],
      nickname: ["nickname"],
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

export async function verifyAction(prevState: ActionResult, formData: FormData) {
  const { t } = await getServerTranslator();
  const email = String(formData.get("email") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const inviteToken = String(formData.get("inviteToken") ?? "").trim();

  try {
    if (!email || !code) {
      return actionError(t("Email and code are required."), { code: t("Code is required") });
    }

    const authService = await resolveProvider(AuthService);
    const user = await authService.verifyCode(email, code);

    await createSessionCookie({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    redirect(inviteToken ? `/dashboard/settings?invite=${encodeURIComponent(inviteToken)}` : "/dashboard");
  } catch (error) {
    const response = actionErrorFromException(error, t, {
      code: ["code", "verification code"],
    });

    return actionError(response.message, response.fields);
  }
}

export async function resendCodeAction(prevState: ActionResult, formData: FormData) {
  const { t } = await getServerTranslator();
  const email = String(formData.get("email") ?? "").trim();

  try {
    if (!email) {
      return actionError(t("Email is required."));
    }

    const authService = await resolveProvider(AuthService);
    await authService.resendCode(email);

    return {
      success: true,
      message: t("A new verification code has been sent to your email."),
    };
  } catch (error) {
    const response = actionErrorFromException(error, t, {});
    return actionError(response.message, response.fields);
  }
}
