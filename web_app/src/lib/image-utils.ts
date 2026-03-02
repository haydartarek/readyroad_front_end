// ─── Types ───────────────────────────────────────────────

/** Maps Dutch folder names (from backend) to English folder names (in public/) */
const FOLDER_NAME_MAP: Record<string, string> = {
  'gevaarsborden':     'danger_signs',
  'voorrangsborden':   'priority_signs',
  'verbodsborden':     'prohibition_signs',
  'gebodsborden':      'mandatory_signs',
  'onderborden':       'additional_signs',
  'zoneborden':        'zone_signs',
  'aanwijzingsborden': 'information_signs',
  'afbakeningsborden': 'delineation_signs',
  'parkeren':          'parking_signs',
  'Informatieborden_en_tijdelijke_verkeersmaatregelen': 'information_signs',
  'direction_signs':   'information_signs',
};

// ─── Constants ───────────────────────────────────────────

const ASSET_PREFIX_MAP: [prefix: string, replacement: string][] = [
  ['assets/traffic_signs/', '/images/signs/'],
  ['assets/signs/',         '/images/signs/'],
  ['assets/',               '/images/'],
  ['images/',               '/images/'],
];

/** Fallback placeholder image for missing traffic sign images */
export const FALLBACK_IMAGE =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZTwvdGV4dD48L3N2Zz4=';

// ─── Helpers ─────────────────────────────────────────────

/**
 * Convert an asset path from the backend to a public URL.
 * Handles both traffic sign images and question images.
 */
export function convertToPublicImageUrl(src: string | undefined): string | undefined {
  if (!src) return undefined;

  // Already an absolute URL — return as-is
  if (src.startsWith('http')) return src;

  // Normalize prefix
  let path = src;
  for (const [prefix, replacement] of ASSET_PREFIX_MAP) {
    if (path.startsWith(prefix)) {
      path = replacement + path.slice(prefix.length);
      break;
    }
  }

  // Ensure leading slash
  if (!path.startsWith('/')) path = `/${path}`;

  // Map Dutch folder names → English
  for (const [dutch, english] of Object.entries(FOLDER_NAME_MAP)) {
    if (path.includes(`/${dutch}/`)) {
      path = path.replace(`/${dutch}/`, `/${english}/`);
      break;
    }
  }

  return path;
}
