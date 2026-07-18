export function buildAbsoluteUrl(path: string, appUrl: string): string {
  return new URL(path, `${appUrl.replace(/\/+$/, "")}/`).toString();
}

export function toMetadataDescription(
  value: string | null | undefined,
  fallback: string,
  maxLength = 160,
): string {
  const normalized = value?.replace(/\s+/g, " ").trim() || fallback;

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
