/**
 * Traffic Sign Image Mapping
 * Maps API image paths to actual file locations
 */

export const IMAGE_PATH_MAPPINGS: Record<string, string> = {
    // Delineation signs that are actually in bicycle_signs
    'M1.png': '/images/signs/bicycle_signs/M1.png',
    'M2.png': '/images/signs/bicycle_signs/M2.png',
    'M3.png': '/images/signs/bicycle_signs/M3.png',
    'M4.png': '/images/signs/bicycle_signs/M4.png',
    'M5.png': '/images/signs/bicycle_signs/M5.png',
    'M6.png': '/images/signs/bicycle_signs/M6.png',
    'M7.png': '/images/signs/bicycle_signs/M7.png',
    'M8.png': '/images/signs/bicycle_signs/M8.png',
    'M9.png': '/images/signs/bicycle_signs/M9.png',
    'M10.png': '/images/signs/bicycle_signs/M10.png',
    'M11.png': '/images/signs/bicycle_signs/M11.png',
    'M12.png': '/images/signs/bicycle_signs/M12.png',
    'M13.png': '/images/signs/bicycle_signs/M13.png',
    'M14.png': '/images/signs/bicycle_signs/M14.png',
    'M15.png': '/images/signs/bicycle_signs/M15.png',
    'M16.png': '/images/signs/bicycle_signs/M16.png',
    'M17.png': '/images/signs/bicycle_signs/M17.png',
    'M18.png': '/images/signs/bicycle_signs/M18.png',
    'M19.png': '/images/signs/bicycle_signs/M19.png',
    'M20.png': '/images/signs/bicycle_signs/M20.png',

    // Version variants
    'F50b.png': '/images/signs/information_signs/F50bis.png',
    'F45b-v2.png': '/images/signs/information_signs/F45b.png',
    'A33-v1.png': '/images/signs/danger_signs/A33.png',

    // Priority signs variants
    'B15A-v1.png': '/images/signs/priority_signs/B15a.png',
    'B15A-v2.png': '/images/signs/priority_signs/B15a.png',

    // Prohibition signs with speed limits
    'C43_50.png': '/images/signs/prohibition_signs/C43.png',
    'C43_70.png': '/images/signs/prohibition_signs/C43.png',
    'C43_90.png': '/images/signs/prohibition_signs/C43.png',

    // Mandatory signs variants
    'D1a-links.png': '/images/signs/mandatory_signs/D1a.png',
    'D1a-rechts.png': '/images/signs/mandatory_signs/D1a.png',
    'D4-links.png': '/images/signs/mandatory_signs/D4.png',
    'D4-rechts.png': '/images/signs/mandatory_signs/D4.png',

    // Parking signs variants
    'E9a-v2.png': '/images/signs/parking_signs/E9a.png',
    'E9a-v3.png': '/images/signs/parking_signs/E9a.png',
    'E9a-v6.png': '/images/signs/parking_signs/E9a.png',
    'E9a-v7.png': '/images/signs/parking_signs/E9a.png',
    'E9a-v10.png': '/images/signs/parking_signs/E9a.png',
    'E9g-v1.png': '/images/signs/parking_signs/E9g.png',

    // Zone signs variants
    'ZC5-v1.png': '/images/signs/zone_signs/ZC5.png',
    'ZC21T-v2.png': '/images/signs/zone_signs/ZC21T.png',
    'ZC21-zone.png': '/images/signs/zone_signs/ZC21.png',
    'ZC35-v1.png': '/images/signs/zone_signs/ZC35.png',
    'ZC35T-v1.png': '/images/signs/zone_signs/ZC35T.png',
    'ZE1-v1.png': '/images/signs/zone_signs/ZE1.png',
    'ZE9a-v1.png': '/images/signs/zone_signs/ZE9a.png',
    'ZE9a-v2.png': '/images/signs/zone_signs/ZE9a.png',
    'ZE9a-v3.png': '/images/signs/zone_signs/ZE9a.png',
    'ZE9aT-v1.png': '/images/signs/zone_signs/ZE9aT.png',
    'ZE9T-v1.png': '/images/signs/zone_signs/ZE9T.png',

    // Information signs variants
    'F117-v1.png': '/images/signs/information_signs/F117.png',
    'F118-v1.png': '/images/signs/information_signs/F118.png',
    'F97-v1.png': '/images/signs/information_signs/F97.png',

    // Additional signs variants (these don't exist, use base sign)
    'GIII-uitrit.png': '/images/signs/additional_signs/GIII.png',
    'GIII-industriezone.png': '/images/signs/additional_signs/GIII.png',
    'GIII-ijzel.png': '/images/signs/additional_signs/GIII.png',
    'GIII-aquaplaning.png': '/images/signs/additional_signs/GIII.png',
    'GVIId-PR.png': '/images/signs/additional_signs/GVIId.png',
    // 'GVIId-CARPOOL.png': Image now exists in additional_signs folder
    'M12-30min.png': '/images/signs/additional_signs/GIII.png',
    'M12-richtingen.png': '/images/signs/additional_signs/GIII.png',
    'M12-fiets-brom.png': '/images/signs/additional_signs/GIII.png',
};

/**
 * Get the correct image path for a traffic sign
 * @param originalPath - The original path from the API
 * @returns The corrected path to the actual image file
 */
export function getTrafficSignImagePath(originalPath: string): string {
    // Extract filename from path
    const filename = originalPath.split('/').pop() || '';

    // Check if we have a direct mapping
    if (IMAGE_PATH_MAPPINGS[filename]) {
        return IMAGE_PATH_MAPPINGS[filename];
    }

    // If no mapping, return original path
    return originalPath;
}
