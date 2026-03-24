export type ActionResult<T = undefined> = {
  success: boolean;
  message: string;
  fields?: Record<string, string>;
  data?: T;
};

export const idleActionState: ActionResult = {
  success: false,
  message: "",
};

export function actionSuccess<T = undefined>(message: string, data?: T): ActionResult<T> {
  return {
    success: true,
    message,
    data,
  };
}

export function actionError(message: string, fields?: Record<string, string>): ActionResult {
  return {
    success: false,
    message,
    fields,
  };
}

export function translateActionFields(
  errors: Record<string, string[]>,
  t: (key: string) => string,
  fieldNames: string[],
) {
  return Object.fromEntries(fieldNames.map((fieldName) => [fieldName, errors[fieldName]?.[0] ? t(errors[fieldName][0]!) : ""]));
}
