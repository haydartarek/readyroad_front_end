// ─── Image Path Mappings ─────────────────────────────────
// Maps API image filenames to actual public/ file locations.
// Handles mismatches, version variants, and cross-folder signs.

const SIGNS = '/images/signs';

export const IMAGE_PATH_MAPPINGS: Record<string, string> = {
  // Version variants → canonical file
  // Note: F50b.png maps directly via canonical path (no remap needed)
  'F45b-v2.png': `${SIGNS}/information_signs/F45b Doodlopende weg (rechts_links).png`,

  // Priority signs
  'B15A-v1.png': `${SIGNS}/priority_signs/B15A Variant schuine rechts.png`,
  'B15A-v2.png': `${SIGNS}/priority_signs/B15A Versmalling van rechts.png`,

  // Prohibition signs with speed limit variants → canonical C43 speed images
  'C43_10.png': `${SIGNS}/prohibition_signs/C43 Verbod te rijden met een grotere snelheid dan 10 km.png`,
  'C43_50.png': `${SIGNS}/prohibition_signs/C43 Verbod te rijden met een grotere snelheid dan 50 km.png`,
  'C43_70.png': `${SIGNS}/prohibition_signs/C43 Verbod te rijden met een grotere snelheid dan 70 km.png`,
  'C43_90.png': `${SIGNS}/prohibition_signs/C43 Verbod te rijden met een grotere snelheid dan 70 km.png`,
  'C43.png':    `${SIGNS}/prohibition_signs/C43 Verbod te rijden met een grotere snelheid dan 30 km.png`,

  // Mandatory signs — canonical sign_code keys (post-V146)
  'D1a.png':        `${SIGNS}/mandatory_signs/D1a Verplichting rechtdoor.png`,
  'D1b-left.png':   `${SIGNS}/mandatory_signs/D1b Verplichting links afslaan.png`,
  'D1b-right.png':  `${SIGNS}/mandatory_signs/D1b Verplichting rechts afslaan.png`,
  'D1c.png':        `${SIGNS}/mandatory_signs/D1c Verplichting links aanhouden.png`,
  'D1d.png':        `${SIGNS}/mandatory_signs/D1d Verplichting rechts aanhouden.png`,
  'D3a.png':        `${SIGNS}/mandatory_signs/D3a Verplicht één van de pijlen te volgen.png`,
  'D3b.png':        `${SIGNS}/mandatory_signs/D3b Verplicht één van de pijlen te volgen.png`,
  'D4-straight.png':`${SIGNS}/mandatory_signs/D4 Verplicht rechtdoor voor voertuigen die gevaarlijke goederen vervoeren.png`,
  'D4-left.png':    `${SIGNS}/mandatory_signs/D4 Verplicht linksaf voor voertuigen die gevaarlijke goederen vervoeren.png`,
  'D4-right.png':   `${SIGNS}/mandatory_signs/D4 Verplicht rechts voor voertuigen die gevaarlijke goederen vervoeren.png`,
  'D5.png':         `${SIGNS}/mandatory_signs/D5 Verplicht rondgaand verkeer.png`,
  'D7.png':         `${SIGNS}/mandatory_signs/D7 Verplicht fietspad.png`,
  'D9a.png':        `${SIGNS}/mandatory_signs/D9a Deel van de weg voorbehouden voor voetgangers en fietsers.png`,
  'D9b.png':        `${SIGNS}/mandatory_signs/D9b Deel van de weg voorbehouden voor voetgangers en fietsers.png`,
  'D10.png':        `${SIGNS}/mandatory_signs/D10 Deel van de weg voorbehouden voor voetgangers en fietsers.png`,
  'D11.png':        `${SIGNS}/mandatory_signs/D11 Verplichte weg voor voetgangers.png`,
  // Legacy fallback keys (pre-V146 sign_codes still in cached/old data)
  'D1a-links.png':  `${SIGNS}/mandatory_signs/D1c Verplichting links aanhouden.png`,
  'D1a-rechts.png': `${SIGNS}/mandatory_signs/D1d Verplichting rechts aanhouden.png`,
  'D4-links.png':   `${SIGNS}/mandatory_signs/D4 Verplicht linksaf voor voertuigen die gevaarlijke goederen vervoeren.png`,
  'D4-rechts.png':  `${SIGNS}/mandatory_signs/D4 Verplicht rechts voor voertuigen die gevaarlijke goederen vervoeren.png`,
  'D4.png':         `${SIGNS}/mandatory_signs/D4 Verplicht rechtdoor voor voertuigen die gevaarlijke goederen vervoeren.png`,

  // Parking signs
  'E9a-electric.png': `${SIGNS}/parking_signs/E9a elektrisch laden Parkeerplaats voorbehouden voor het elektrisch opladen van je wagen.png`,
  'E9a-disabled.png': `${SIGNS}/parking_signs/E9a mindervaliden Parkeren enkel toegelaten voor mindervaliden.png`,
  'E9a-disc.png':     `${SIGNS}/parking_signs/E9a parkeerschijf Parkeren beperkt in tijd, parkeerschijf verplicht.png`,
  'E9j.png':          `${SIGNS}/parking_signs/E9j wisselend parkeren Parkeerplaats voorzien voor wisselend parkeren fietsers en auto’s.png`,

  // Zone signs — canonical sign codes, no variant remapping needed

  // Information signs
  'F117-v1.png': `${SIGNS}/information_signs/F117 Begin van lage emissiezone.png`,
  'F118-v1.png': `${SIGNS}/information_signs/F118 Einde van lage emissiezone.png`,
  'F97-v1.png':  `${SIGNS}/information_signs/F97 Rijstrook versmalling.png`,

  // Additional signs (G-series) — canonical sign codes, no variant remapping needed

  // M12 sub-variants → correct additional_signs canonical files
  'M12-30min.png':          `${SIGNS}/additional_signs/M12 30 min parkeren.png`,
  'M12-richtingen.png':     `${SIGNS}/additional_signs/M12-richtingen.png`,
  'M12-fiets-brom.png':     `${SIGNS}/additional_signs/M12 Uitzonderd fiets en bromfiets A_P.png`,

  // Legacy fallbacks — signs that still have old short-name URLs in DB
  // (before V134 migration runs these may still appear)
  'A3.png':  `${SIGNS}/danger_signs/A3 Gevaarlijke daling.png`,
  'A5.png':  `${SIGNS}/danger_signs/A5 Gevaarlijke helling.png`,
  'A7a.png': `${SIGNS}/danger_signs/A7a Versmalling langs beide zijden.png`,
  'A9.png':  `${SIGNS}/danger_signs/A9 Beweegbare brug.png`,
  'A13.png': `${SIGNS}/danger_signs/A13 Dwarse uitholling of ezelsrug.png`,
  'A14.png': `${SIGNS}/danger_signs/A14 Verhoogde inrichting.png`,
  'A15.png': `${SIGNS}/danger_signs/A15 Gladde rijbaan - Slipgevaar.png`,
  'A27.png': `${SIGNS}/danger_signs/A27 Overstekend groot wild.png`,
  'A29.png': `${SIGNS}/danger_signs/A29 Overstekend vee.png`,
  'A31.png': `${SIGNS}/danger_signs/A31 Werken.png`,
  'A35.png': `${SIGNS}/danger_signs/A35 Vliegtuigen op geringe hoogte.png`,
  'A37.png': `${SIGNS}/danger_signs/A37 Zijwind.png`,
  'A39.png': `${SIGNS}/danger_signs/A39 Twee richtingsverkeer toegelaten na een stuk éénrichtingsverkeer.png`,
  'A41.png': `${SIGNS}/danger_signs/A41 Overweg met slagbomen.png`,
  'A43.png': `${SIGNS}/danger_signs/A43 Overweg zonder slagbomen.png`,
  'A49.png': `${SIGNS}/danger_signs/A49 Openbare weg kruist met een of meer in de rijbaan aangelegde sporen.png`,
  'A50.png': `${SIGNS}/danger_signs/A50 Opgelet file.png`,
  'A51.png': `${SIGNS}/danger_signs/A51 Gevaar dat niet door een speciaal symbool wordt bepaald.png`,

  'C1.png':   `${SIGNS}/prohibition_signs/C1 Verboden richting voor iedere bestuurder.png`,
  'C3.png':   `${SIGNS}/prohibition_signs/C3 Verboden toegang in beide richtingen voor iedere bestuurder.png`,
  'C9.png':   `${SIGNS}/prohibition_signs/C9 Verboden toegang voor bestuurders van bromfietsen.png`,
  'C13.png':  `${SIGNS}/prohibition_signs/C13 Verboden toegang voor bestuurders van gespannen..png`,
  'C15.png':  `${SIGNS}/prohibition_signs/C15 Verboden toegang voor ruiters.png`,
  'C17.png':  `${SIGNS}/prohibition_signs/C17 Verboden toegang voor bestuurders van handkarren.png`,
  'C19.png':  `${SIGNS}/prohibition_signs/C19 Verboden toegang voor voetgangers.png`,
  'C21.png':  `${SIGNS}/prohibition_signs/C21 Verboden toegang voor voertuigen met een massa groter dan aangeduid.png`,
  'C22.png':  `${SIGNS}/prohibition_signs/C22 Verboden toegang voor bestuurders van autocars.png`,
  'C23.png':  `${SIGNS}/prohibition_signs/C23 Verboden toegang voor bestuurders van voertuigen bestemd of gebruikt voor het vervoer van zaken.png`,
  'C24a.png': `${SIGNS}/prohibition_signs/C24a Verboden toegang voor bestuurders van voertuigen die gevaarlijke goederen vervoeren.png`,
  'C24b.png': `${SIGNS}/prohibition_signs/C24b Verboden toegang voor bestuurders van voertuigen die gevaarlijke ontvlambare of ontplofbare stoffen vervoeren.png`,
  'C24c.png': `${SIGNS}/prohibition_signs/C24c Verboden toegang voor bestuurders van voertuigen die gevaarlijke verontreinigende stoffen vervoeren.png`,
  'C25.png':  `${SIGNS}/prohibition_signs/C25 Verboden voor voertuigen langer dan het aangeduide.png`,
  'C27.png':  `${SIGNS}/prohibition_signs/C27 Verboden voor voertuigen breder dan het aangeduide.png`,
  'C29.png':  `${SIGNS}/prohibition_signs/C29 Verboden voor voertuigen hoger dan het aangeduide.png`,
  'C31a.png': `${SIGNS}/prohibition_signs/C31a Verbod om links af te slaan.png`,
  'C31b.png': `${SIGNS}/prohibition_signs/C31b Verbod rechts af te slaan.png`,
  'C33.png':  `${SIGNS}/prohibition_signs/C33 Verbod om te keren.png`,
  'C37.png':  `${SIGNS}/prohibition_signs/C37 Einde verbod opgelegd door het verkeersbord C35.png`,
  'C39.png':  `${SIGNS}/prohibition_signs/C39 Verbod voertuigen met toegelaten massa groter dan 3500 kg in te halen.png`,
  'C45.png':  `${SIGNS}/prohibition_signs/C45 Einde van de snelheidsbeperking opgelegd door het verkeersbord C43.png`,
  'C46.png':  `${SIGNS}/prohibition_signs/C46 Einde van alle plaatselijke verbodsbepalingen opgelegd aan de voertuigen in beweging.png`,
  'C47.png':  `${SIGNS}/prohibition_signs/C47 Tolpost. Verbod voorbij te rijden zonder te stoppen.png`,

  'D1b.png': `${SIGNS}/mandatory_signs/D1b Verplichting links afslaan.png`,
  'D1e.png': `${SIGNS}/mandatory_signs/D1e Verplicht de aangeduide richting te volgen (linksaf).png`,
  'D1f.png': `${SIGNS}/mandatory_signs/D1f Verplicht de aangeduide richting te volgen (rechtsaf).png`,

  'F97.png':  `${SIGNS}/information_signs/F97 Rijstrook versmalling.png`,
  'F117.png': `${SIGNS}/information_signs/F117 Begin van lage emissiezone.png`,
  'F118.png': `${SIGNS}/information_signs/F118 Einde van lage emissiezone.png`,
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
