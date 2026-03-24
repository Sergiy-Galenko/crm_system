export type SearchParamsValue = string | string[] | undefined;
export type SearchParamsRecord = Record<string, SearchParamsValue>;

export function getParam(searchParams: SearchParamsRecord, key: string) {
  const value = searchParams[key];

  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export function getPage(searchParams: SearchParamsRecord, defaultPage = 1) {
  const rawValue = Number(getParam(searchParams, "page"));
  return Number.isFinite(rawValue) && rawValue > 0 ? rawValue : defaultPage;
}

export function createPageHref(pathname: string, searchParams: SearchParamsRecord, overrides: Record<string, string>) {
  const urlSearchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    const stringValue = Array.isArray(value) ? value[0] : value;

    if (stringValue) {
      urlSearchParams.set(key, stringValue);
    }
  }

  for (const [key, value] of Object.entries(overrides)) {
    if (value) {
      urlSearchParams.set(key, value);
      continue;
    }

    urlSearchParams.delete(key);
  }

  const queryString = urlSearchParams.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}
