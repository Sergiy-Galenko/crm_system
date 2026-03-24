export function toTrimmedString(value: unknown) {
  return String(value ?? "").trim();
}

export function toOptionalString(value: unknown) {
  const normalized = toTrimmedString(value);
  return normalized || undefined;
}

export function toUppercaseString(value: unknown) {
  return toTrimmedString(value).toUpperCase();
}

export function toOptionalDate(value: unknown) {
  const normalized = toOptionalString(value);
  return normalized ? new Date(normalized) : undefined;
}

export function toRequiredDate(value: unknown) {
  return new Date(toTrimmedString(value));
}

export function toRequiredNumber(value: unknown) {
  return Number(value);
}

export function toOptionalInteger(value: unknown) {
  const normalized = toOptionalString(value);
  return normalized ? Number(normalized) : undefined;
}

export function toBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  return String(value ?? "") !== "false";
}
