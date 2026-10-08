export function buildAbsoluteUrl(path: string, appUrl: string): string {
  return new URL(path, `${appUrl.replace(/\/+$/, "")}/`).toString();
}

export function toBrandedMetadataTitle(title: string): string {
  const content = title
    .trim()
    .replace(/^Rijvia\s*(?:[-\u2013\u2014|\u2039>])\s*/iu, "")
    .replace(/^Rijvia\s+/iu, "")
    .replace(/\s*(?:[-\u2013\u2014|\u2039>])?\s*Rijvia\s*$/iu, "")
    .replace(/\s+(?:[-\u2013\u2014]|\u2039|>)\s+/g, " | ")
    .replace(/\s+-\s+/g, " | ")
    .split(/\s*\|\s*/)
    .map((section) => section.trim())
    .filter((section) => section && !/^Rijvia$/iu.test(section))
    .map((section) => section.replace(/\bRijvia\b/giu, "Rijvia"))
    .join(" | ");

  return content ? `${content} | Rijvia` : "Rijvia";
}

export function normalizeSeoBrand(value: string): string {
  return value.replace(/\bRijvia\b/giu, "Rijvia");
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
