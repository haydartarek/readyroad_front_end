/** Fallback placeholder image for missing traffic sign images */
export const FALLBACK_IMAGE =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZTwvdGV4dD48L3N2Zz4=";

// ─── Helpers ─────────────────────────────────────────────

/**
 * Build a backend-owned traffic sign image URL from the database image path.
 */
export function getSignImageUrl(
  imagePath: string | null | undefined,
): string | null {
  if (!imagePath?.trim()) return null;

  const value = imagePath.trim();

  if (value.startsWith("http") || value.startsWith("data:")) {
    return value;
  }

  const normalizedPath = value.startsWith("/") ? value : `/${value}`;

  if (normalizedPath.startsWith("/images/signs/")) {
    return normalizedPath;
  }

  return normalizedPath;
}

/**
 * Convert an asset path from the backend to a browser URL.
 * Kept for existing image consumers; sign images are delegated to getSignImageUrl.
 */
export function convertToPublicImageUrl(
  src: string | undefined,
): string | undefined {
  if (!src) return undefined;

  const signImageUrl = getSignImageUrl(src);
  if (signImageUrl) return signImageUrl;

  return undefined;
}
