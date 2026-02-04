/**
 * Convert asset path from backend to public URL
 * Handles both traffic sign images and question images
 */
export function convertToPublicImageUrl(src: string | undefined): string | undefined {
  if (!src) return undefined;

  // If already a public URL or HTTP URL, return as-is
  if (src.startsWith('/images/') || src.startsWith('http')) {
    return src;
  }

  // Convert from "assets/traffic_signs/..." to "/images/signs/..."
  if (src.startsWith('assets/traffic_signs/')) {
    return '/' + src.replace('assets/traffic_signs/', 'images/signs/');
  }

  // Convert from "assets/..." to "/images/..."
  if (src.startsWith('assets/')) {
    return '/' + src.replace('assets/', 'images/');
  }

  return src;
}

/**
 * Fallback placeholder image for missing images
 */
export const FALLBACK_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZTwvdGV4dD48L3N2Zz4=';
