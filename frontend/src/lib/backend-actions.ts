import { HttpException } from "@nestjs/common";
import type { RequestUser } from "@backend/common/auth/request-user.interface";
import { DtoValidationException } from "@backend/common/validation/dto-validation.exception";

type CurrentUserLike = {
  id: string;
  email: string;
  role: string;
};

export function toRequestUser(user: CurrentUserLike): RequestUser {
  return {
    userId: user.id,
    email: user.email,
    role: user.role as RequestUser["role"],
  };
}

export function translateFieldMap(fields: Record<string, string>, t: (key: string) => string) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, t(value)]));
}

export function actionErrorFromException(
  error: unknown,
  t: (key: string) => string,
  fieldHints?: Record<string, string[]>,
) {
  if (error instanceof DtoValidationException) {
    return {
      message: t(error.message),
      fields: translateFieldMap(error.fields, t),
    };
  }

  if (error instanceof HttpException) {
    const message = error.message || "Something went wrong.";
    const fields: Record<string, string> = {};

    if (fieldHints) {
      const normalizedMessage = message.toLowerCase();

      for (const [field, hints] of Object.entries(fieldHints)) {
        if (hints.some((hint) => normalizedMessage.includes(hint.toLowerCase()))) {
          fields[field] = t(message);
        }
      }
    }

    return {
      message: t(message),
      fields: Object.keys(fields).length ? fields : undefined,
    };
  }

  return {
    message: t("Something went wrong."),
    fields: undefined,
  };
}
