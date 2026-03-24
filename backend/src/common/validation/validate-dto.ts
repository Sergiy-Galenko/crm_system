import { plainToInstance, type ClassConstructor } from "class-transformer";
import { validate } from "class-validator";
import { DtoValidationException } from "./dto-validation.exception";

function flattenValidationErrors(errors: Awaited<ReturnType<typeof validate>>) {
  const fieldErrors: Record<string, string> = {};

  for (const error of errors) {
    if (error.constraints) {
      fieldErrors[error.property] = Object.values(error.constraints)[0] ?? "Invalid value.";
    }

    if (error.children?.length) {
      Object.assign(fieldErrors, flattenValidationErrors(error.children));
    }
  }

  return fieldErrors;
}

export async function validateDto<T extends object>(dtoClass: ClassConstructor<T>, payload: unknown) {
  const instance = plainToInstance(dtoClass, payload);
  const errors = await validate(instance as object, {
    whitelist: true,
    forbidNonWhitelisted: false,
  });

  if (errors.length) {
    throw new DtoValidationException(flattenValidationErrors(errors));
  }

  return instance;
}
