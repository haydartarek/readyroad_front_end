/**
 * Map Dutch folder names (from backend) to English folder names (in public/)
 */
const FOLDER_NAME_MAP: Record<string, string> = {
  'gevaarsborden': 'danger_signs',
  'voorrangsborden': 'priority_signs',
  'verbodsborden': 'prohibition_signs',
  'gebodsborden': 'mandatory_signs',
  'onderborden': 'additional_signs',
  'zoneborden': 'zone_signs',
  'aanwijzingsborden': 'information_signs',
  'afbakeningsborden': 'delineation_signs',
  'Informatieborden_en_tijdelijke_verkeersmaatregelen': 'information_signs',
  'direction_signs': 'information_signs',
};

/**
 * Convert asset path from backend to public URL
 * Handles both traffic sign images and question images
 */
export function convertToPublicImageUrl(src: string | undefined): string | undefined {
  if (!src) return undefined;

  // If already an HTTP URL, return as-is
  if (src.startsWith('http')) {
    return src;
  }

  let path = src;

  // Normalize prefix: ensure path starts with /images/signs/
  if (path.startsWith('assets/traffic_signs/')) {
    path = '/images/signs/' + path.slice('assets/traffic_signs/'.length);
  } else if (path.startsWith('assets/signs/')) {
    path = '/images/signs/' + path.slice('assets/signs/'.length);
  } else if (path.startsWith('assets/')) {
    path = '/images/' + path.slice('assets/'.length);
  } else if (path.startsWith('images/')) {
    path = '/' + path;
  } else if (!path.startsWith('/')) {
    path = '/' + path;
  }

  // Map Dutch folder names to English
  for (const [dutch, english] of Object.entries(FOLDER_NAME_MAP)) {
    if (path.includes('/' + dutch + '/')) {
      path = path.replace('/' + dutch + '/', '/' + english + '/');
      break;
    }
  }

  // Encode special characters in path segments (spaces, parentheses, etc.)
  path = path.split('/').map((segment, i) =>
    i === 0 && segment === '' ? '' : encodeURIComponent(segment)
  ).join('/');

  return path;
}

/**
 * Fallback placeholder image for missing images
 */
export const FALLBACK_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZTwvdGV4dD48L3N2Zz4=';
