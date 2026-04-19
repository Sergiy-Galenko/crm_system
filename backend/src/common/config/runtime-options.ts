type HeaderStore = {
  get(name: string): string | null | undefined;
};

const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);
const FALSE_VALUES = new Set(["0", "false", "no", "off"]);

function getOptionalEnvValue(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function isLocalHost(host: string) {
  const normalizedHost = host.trim().toLowerCase().replace(/:\d+$/u, "");
  return normalizedHost === "localhost" || normalizedHost === "127.0.0.1" || normalizedHost === "::1";
}

export function getCookieSecure() {
  const override = getOptionalEnvValue("COOKIE_SECURE")?.toLowerCase();

  if (!override) {
    return process.env.NODE_ENV === "production";
  }

  if (TRUE_VALUES.has(override)) {
    return true;
  }

  if (FALSE_VALUES.has(override)) {
    return false;
  }

  return process.env.NODE_ENV === "production";
}

export function getAppOrigin() {
  return getOptionalEnvValue("APP_ORIGIN")?.replace(/\/+$/u, "");
}

export function getRequestOrigin(headerStore: HeaderStore) {
  const appOrigin = getAppOrigin();

  if (appOrigin) {
    return appOrigin;
  }

  const forwardedHost = headerStore.get("x-forwarded-host") ?? headerStore.get("host");

  if (!forwardedHost) {
    return "http://localhost:3000";
  }

  const fallbackProto = isLocalHost(forwardedHost) ? "http" : getCookieSecure() ? "https" : "http";
  const forwardedProto =
    headerStore.get("x-forwarded-proto") ??
    headerStore.get("origin")?.split("://")[0] ??
    fallbackProto;

  return `${forwardedProto}://${forwardedHost}`;
}
