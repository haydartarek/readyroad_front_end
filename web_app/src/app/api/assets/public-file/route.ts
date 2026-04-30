import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROOT = path.resolve(process.cwd(), "public");

const LEGACY_ASSET_ALIASES: Record<string, string> = {
  "/images/signs/information_signs/F1b Begin van een bebouwde kom-2.png":
    "/images/signs/information_signs/F1b Begin van een bebouwde kom.png",
  "/images/signs/information_signs/F4a Zone 30 km u.png":
    "/images/signs/information_signs/F4a Zone 30 km.png",
  "/images/signs/information_signs/F4b Einde zone 30 kmu.png":
    "/images/signs/information_signs/F4b - Einde zone 30 km.png",
  "/images/signs/information_signs/F50bis Opgepast als je van richting verandert fietsers.png":
    "/images/signs/information_signs/F50bis Opgepast als je van richting veranderd, fietsers.png",
  "/images/signs/information_signs/F99a Voorbehouden voor voetgangers fietsers ruiters en speed pedelecs.png":
    "/images/signs/information_signs/F99a Voorbehouden voor het verkeer van voetgangers, fietsers, ruiters en bestuurders van speed pedelecs.png",
  "/images/signs/information_signs/F99c Voorbehouden voor landbouwvoertuigen voetgangers fietsers ruiters en speed pedelecs.png":
    "/images/signs/information_signs/F99c Voorbehouden voor het verkeer van landbouwvoertuigen, voetgangers, fietsers, ruiters en bestuurders van speed pedelecs.png",
  "/images/signs/information_signs/F101a Einde voorbehouden voor voetgangers fietsers ruiters en speed pedelecs.png":
    "/images/signs/information_signs/F101a Einde voorbehouden voor het verkeer van voetgangers, fietsers, ruiters en bestuurders van speed pedelecs.png",
  "/images/signs/information_signs/F101c Einde voorbehouden voor landbouwvoertuigen voetgangers fietsers ruiters en speed pedelecs.png":
    "/images/signs/information_signs/F101c Einde voorbehouden voor het verkeer van landbouwvoertuigen, voetgangers, fietsers, ruiters en bestuurders van speed pedelecs.png",
  "/images/signs/parking_signs/E9c Parkeren uitsluitend voorvrachtwagens.png":
    "/images/signs/parking_signs/E9c Parkeren uitsluitend voor vrachtwagens.png",
  "/images/signs/prohibition_signs/C13 Verboden toegang voor bestuurders van gespannen..png":
    "/images/signs/prohibition_signs/C13 Verboden toegang voor bestuurders van gespannen.png",
  "/images/signs/prohibition_signs/C5 Verboden toegang voor bestuurders van motorvoertuigen met meer dan twee wielen..png":
    "/images/signs/prohibition_signs/C5 Verboden toegang voor bestuurders van motorvoertuigen met meer dan twee wielen.png",
  "/images/signs/zone_signs/ZC5 Einde zone verboden toegang voor motorvoertuigen met meer dan 2 wielen.png":
    "/images/signs/zone_signs/ZC5- Einde zone verboden toegang voor motorvoertuigen met meer dan 2 wielen.png",
  "/images/signs/zone_signs/ZC21 Zone verboden toegang voor bestuurders van voertuigen waarvan de massa hoger is dan de aangeduide massa.png":
    "/images/signs/zone_signs/ZC21 Zone verboden toegang voor bestuurders van voertuigen waarvan de massa hoger dan 3500 kg.png",
  "/images/signs/zone_signs/ZC21 Einde zone verboden toegang voor bestuurders van voertuigen waarvan de massa hoger is dan de aangeduide massa.png":
    "/images/signs/zone_signs/ZC21- Einde zone verboden toegang voor bestuurders van voertuigen waarvan de massa hoger dan 3500 kg.png",
  "/images/signs/zone_signs/ZC35 Einde zone verboden inhalen.png":
    "/images/signs/zone_signs/ZC35- Einde zone verboden inhalen.png",
  "/images/signs/zone_signs/ZE1 Einde zone parkeerverbod.png":
    "/images/signs/zone_signs/ZE1- Einde zone parkeerverbod.png",
  "/images/signs/zone_signs/ZE9aT Einde zone parkeren uitsluitend voor auto's.png":
    "/images/signs/zone_signs/ZE9aT- Einde zone parkeren uitsluitend voor auto's.png",
  "/images/signs/zone_signs/ZC14 ZONE Fietsstraat.png":
    "/images/signs/zone_signs/ZONE F111- ZONE Fietsstraat.png",
  "/images/signs/zone_signs/ZONE F113 Einde ZONE Fietsstraat.png":
    "/images/signs/zone_signs/ZONE F113- Einde ZONE Fietsstraat.png",
};

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

export async function GET(request: NextRequest) {
  const rawPath = request.nextUrl.searchParams.get("path");

  if (!rawPath) {
    return NextResponse.json({ error: "Invalid asset path" }, { status: 400 });
  }

  const normalizedPath = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;

  if (!normalizedPath.startsWith("/images/")) {
    return NextResponse.json({ error: "Invalid asset path" }, { status: 400 });
  }

  const effectivePath = LEGACY_ASSET_ALIASES[normalizedPath] ?? normalizedPath;
  const normalizedRelative = effectivePath.replace(/^\/+/, "");
  const resolvedPath = path.resolve(PUBLIC_ROOT, normalizedRelative);

  if (!resolvedPath.startsWith(PUBLIC_ROOT)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const fileBuffer = await fs.readFile(resolvedPath);
    const extension = path.extname(resolvedPath).toLowerCase();
    const contentType = CONTENT_TYPES[extension] ?? "application/octet-stream";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
