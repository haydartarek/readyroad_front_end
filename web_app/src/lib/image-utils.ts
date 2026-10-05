/** Fallback placeholder image for missing traffic sign images */
export const FALLBACK_IMAGE =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZTwvdGV4dD48L3N2Zz4=";

// ─── Helpers ─────────────────────────────────────────────

const RIJVIA_MEDIA_FAMILIES = [
  "lessons",
  "quiz",
  "signs",
  "articles",
] as const;

/**
 * Resolve backend-owned Rijvia media to the internal public image route.
 *
 * Examples:
 * - old absolute storage URL containing /images/quiz/... -> /images/quiz/...
 * - images/signs/... -> /images/signs/...
 * - lessons/... -> /images/lessons/...
 *
 * Unrelated external URLs remain unchanged.
 */
export function resolveRijviaMediaUrl(
  src: string | null | undefined,
): string | null {
  const value = src?.trim();

  if (!value) {
    return null;
  }

  if (value.startsWith("data:")) {
    return value;
  }

  for (const family of RIJVIA_MEDIA_FAMILIES) {
    const internalPrefix = `/images/${family}/`;
    const internalIndex = value.indexOf(
      internalPrefix,
    );

    if (internalIndex >= 0) {
      return value.slice(internalIndex);
    }

    const withoutLeadingSlash =
      `images/${family}/`;

    if (value.startsWith(withoutLeadingSlash)) {
      return `/${value}`;
    }

    const legacyPrefix = `${family}/`;

    if (value.startsWith(legacyPrefix)) {
      return `/images/${value}`;
    }
  }

  return value;
}

/**
 * Build a browser-safe traffic sign image URL.
 */
export function getSignImageUrl(
  imagePath: string | null | undefined,
): string | null {
  return resolveRijviaMediaUrl(
    imagePath,
  );
}

/**
 * Convert a backend asset path to a browser URL.
 */
export function convertToPublicImageUrl(
  src: string | undefined,
): string | undefined {
  return (
    resolveRijviaMediaUrl(src) ??
    undefined
  );
}
