// ─── Traffic Sign Image Resolver ──────────────────────────────────────────────
//
// Single source of truth for resolving traffic sign image paths on /traffic-signs.
// All paths are built from /images/signs/<folder>/<filename> only.
// Raw DB image_url values are never used directly for rendering.

import { TrafficSign } from '@/lib/types';
import { FALLBACK_IMAGE } from '@/lib/image-utils';

// ─── Category-letter → public folder ─────────────────────────────────────────

const CATEGORY_FOLDER_MAP: Record<string, string> = {
  A: 'danger_signs',
  B: 'priority_signs',
  C: 'prohibition_signs',
  D: 'mandatory_signs',
  E: 'parking_signs',
  F: 'information_signs',
  G: 'additional_signs',
  H: 'information_signs',
  M: 'additional_signs',   // Fietsersborden (cyclist supplementary signs)
  T: 'delineation_signs',  // Afbakeningsborden
  Z: 'zone_signs',
};

// ─── Explicit overrides for known problematic signs ───────────────────────────
// These signs had mismatched DB paths across migrations. The override guarantees
// the correct public file is always used regardless of the DB value.

const SIGN_CODE_OVERRIDES: Record<string, string> = {
  // F road_markings signs — stored in road_markings/ not information_signs/
  'F39': '/images/signs/road_markings/F39 Aankondiging van een omleiding.png',
  'F79': '/images/signs/road_markings/F79 Tijdelijke verdeling van de rijstroken (met afstandsaanduiding).png',
  'F81': '/images/signs/road_markings/F81 Voorwegwijzer uitwijking.png',
  'F83': '/images/signs/road_markings/F83 Versmalling van de rijbaan.png',
  'F85': '/images/signs/road_markings/F85 Verlegging van de rijbaan.png',
  'F89': '/images/signs/road_markings/F89 Aanduiding van de maximumsnelheid per rijstrook.png',
  'F91': '/images/signs/road_markings/F91 Aanduiding van de maximumsnelheid per rijstrook (zonder afstand).png',
  'F95': '/images/signs/road_markings/F95 Einde van een rijstrook.png',
  'F98': '/images/signs/road_markings/F98 Bijzondere rijstrookregeling.png',
};

// ─── Resolver ─────────────────────────────────────────────────────────────────

/**
 * Resolve the canonical public image path for a traffic sign.
 *
 * Resolution order:
 * 1. Explicit sign-code override (E9a, E9g, etc.)
 * 2. Category-derived folder + filename extracted from imageUrl
 * 3. Fallback placeholder
 *
 * The returned path always starts with /images/signs/<folder>/ and contains
 * unencoded spaces/special characters — SignImage → convertToPublicImageUrl
 * handles the final URL-encoding before the <img> src is set.
 */
export function resolveTrafficSignImage(sign: TrafficSign): string {
  const code      = sign.signCode ?? '';
  const catLetter = (sign.categoryCode ?? code[0] ?? '').toUpperCase();
  const rawUrl    = sign.imageUrl ?? '';

  // 1. Explicit override — bypasses DB value entirely
  if (SIGN_CODE_OVERRIDES[code]) {
    return SIGN_CODE_OVERRIDES[code];
  }

  // 2. Category-based canonical path
  const folder   = CATEGORY_FOLDER_MAP[catLetter];
  const filename = rawUrl.split('/').pop() ?? '';

  if (folder && filename) {
    return `/images/signs/${folder}/${filename}`;
  }

  // 3. Fallback placeholder (sign has no usable image data)
  return FALLBACK_IMAGE;
}
