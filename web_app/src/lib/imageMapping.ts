// ─── Image Path Mappings ─────────────────────────────────
// Maps API image filenames to actual public/ file locations.
// Handles mismatches, version variants, and cross-folder signs.

const SIGNS = '/images/signs';

export const IMAGE_PATH_MAPPINGS: Record<string, string> = {
  // Delineation signs located in bicycle_signs/
  'M1.png':  `${SIGNS}/bicycle_signs/M1.png`,
  'M2.png':  `${SIGNS}/bicycle_signs/M2.png`,
  'M3.png':  `${SIGNS}/bicycle_signs/M3.png`,
  'M4.png':  `${SIGNS}/bicycle_signs/M4.png`,
  'M5.png':  `${SIGNS}/bicycle_signs/M5.png`,
  'M6.png':  `${SIGNS}/bicycle_signs/M6.png`,
  'M7.png':  `${SIGNS}/bicycle_signs/M7.png`,
  'M8.png':  `${SIGNS}/bicycle_signs/M8.png`,
  'M9.png':  `${SIGNS}/bicycle_signs/M9.png`,
  'M10.png': `${SIGNS}/bicycle_signs/M10.png`,
  'M11.png': `${SIGNS}/bicycle_signs/M11.png`,
  'M12.png': `${SIGNS}/bicycle_signs/M12.png`,
  'M13.png': `${SIGNS}/bicycle_signs/M13.png`,
  'M14.png': `${SIGNS}/bicycle_signs/M14.png`,
  'M15.png': `${SIGNS}/bicycle_signs/M15.png`,
  'M16.png': `${SIGNS}/bicycle_signs/M16.png`,
  'M17.png': `${SIGNS}/bicycle_signs/M17.png`,
  'M18.png': `${SIGNS}/bicycle_signs/M18.png`,
  'M19.png': `${SIGNS}/bicycle_signs/M19.png`,
  'M20.png': `${SIGNS}/bicycle_signs/M20.png`,

  // Version variants → canonical file
  'F50b.png':   `${SIGNS}/information_signs/F50bis.png`,
  'F45b-v2.png': `${SIGNS}/information_signs/F45b.png`,
  'A33-v1.png': `${SIGNS}/danger_signs/A33.png`,

  // Priority signs
  'B15A-v1.png': `${SIGNS}/priority_signs/B15a.png`,
  'B15A-v2.png': `${SIGNS}/priority_signs/B15a.png`,

  // Prohibition signs with speed limit variants → base C43
  'C43_50.png': `${SIGNS}/prohibition_signs/C43.png`,
  'C43_70.png': `${SIGNS}/prohibition_signs/C43.png`,
  'C43_90.png': `${SIGNS}/prohibition_signs/C43.png`,

  // Mandatory signs (direction variants → base sign)
  'D1a-links.png':  `${SIGNS}/mandatory_signs/D1a.png`,
  'D1a-rechts.png': `${SIGNS}/mandatory_signs/D1a.png`,
  'D4-links.png':   `${SIGNS}/mandatory_signs/D4.png`,
  'D4-rechts.png':  `${SIGNS}/mandatory_signs/D4.png`,

  // Parking signs
  'E9a-v2.png':  `${SIGNS}/parking_signs/E9a.png`,
  'E9a-v3.png':  `${SIGNS}/parking_signs/E9a.png`,
  'E9a-v6.png':  `${SIGNS}/parking_signs/E9a.png`,
  'E9a-v7.png':  `${SIGNS}/parking_signs/E9a.png`,
  'E9a-v10.png': `${SIGNS}/parking_signs/E9a.png`,
  'E9g-v1.png':  `${SIGNS}/parking_signs/E9g.png`,

  // Zone signs
  'ZC5-v1.png':    `${SIGNS}/zone_signs/ZC5.png`,
  'ZC21T-v2.png':  `${SIGNS}/zone_signs/ZC21T.png`,
  'ZC21-zone.png': `${SIGNS}/zone_signs/ZC21.png`,
  'ZC35-v1.png':   `${SIGNS}/zone_signs/ZC35.png`,
  'ZC35T-v1.png':  `${SIGNS}/zone_signs/ZC35T.png`,
  'ZE1-v1.png':    `${SIGNS}/zone_signs/ZE1.png`,
  'ZE9a-v1.png':   `${SIGNS}/zone_signs/ZE9a.png`,
  'ZE9a-v2.png':   `${SIGNS}/zone_signs/ZE9a.png`,
  'ZE9a-v3.png':   `${SIGNS}/zone_signs/ZE9a.png`,
  'ZE9aT-v1.png':  `${SIGNS}/zone_signs/ZE9aT.png`,
  'ZE9T-v1.png':   `${SIGNS}/zone_signs/ZE9T.png`,

  // Information signs
  'F117-v1.png': `${SIGNS}/information_signs/F117.png`,
  'F118-v1.png': `${SIGNS}/information_signs/F118.png`,
  'F97-v1.png':  `${SIGNS}/information_signs/F97.png`,

  // Additional signs (variants → base sign)
  'GIII-uitrit.png':        `${SIGNS}/additional_signs/GIII.png`,
  'GIII-industriezone.png': `${SIGNS}/additional_signs/GIII.png`,
  'GIII-ijzel.png':         `${SIGNS}/additional_signs/GIII.png`,
  'GIII-aquaplaning.png':   `${SIGNS}/additional_signs/GIII.png`,
  'GVIId-PR.png':           `${SIGNS}/additional_signs/GVIId.png`,
  // 'GVIId-CARPOOL.png' — image now exists in additional_signs/
  'M12-30min.png':          `${SIGNS}/additional_signs/GIII.png`,
  'M12-richtingen.png':     `${SIGNS}/additional_signs/GIII.png`,
  'M12-fiets-brom.png':     `${SIGNS}/additional_signs/GIII.png`,
};

// ─── Helper ──────────────────────────────────────────────

/**
 * Resolve the correct public image path for a traffic sign.
 * Falls back to the original path if no mapping is found.
 */
export function getTrafficSignImagePath(originalPath: string): string {
  const filename = originalPath.split('/').pop() ?? '';
  return IMAGE_PATH_MAPPINGS[filename] ?? originalPath;
}
