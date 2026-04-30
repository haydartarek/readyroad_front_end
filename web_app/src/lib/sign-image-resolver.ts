import { TrafficSign } from "@/lib/types";
import { convertToPublicImageUrl } from "@/lib/image-utils";
import canonicalSignImagePaths from "@/lib/traffic-sign-image-manifest.json";

const CANONICAL_PATHS = canonicalSignImagePaths as string[];
const PATH_BY_FILENAME = new Map<string, string>();

for (const path of CANONICAL_PATHS) {
  const filename = path.split("/").pop();
  if (filename) {
    PATH_BY_FILENAME.set(filename, path);
  }
}

function decodeLeafName(rawUrl: string): string | null {
  if (!rawUrl) {
    return null;
  }

  const leaf = rawUrl.split("/").pop();
  if (!leaf) {
    return null;
  }

  try {
    return decodeURIComponent(leaf);
  } catch {
    return leaf;
  }
}

function matchesSignCode(path: string, signCode: string): boolean {
  const filename = path.split("/").pop() ?? "";
  return (
    filename.startsWith(`${signCode} `) ||
    filename.startsWith(`${signCode}-`) ||
    filename.startsWith(`${signCode}.`) ||
    filename === signCode
  );
}

function normalizeText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLowerCase();
}

function extractSignNames(sign: TrafficSign): string[] {
  return [sign.nameNl, sign.nameEn, sign.nameFr, sign.nameAr]
    .filter((value): value is string => Boolean(value && value.trim()))
    .map((value) => normalizeText(value));
}

export function resolveTrafficSignImage(sign: TrafficSign): string {
  const signCode = sign.signCode ?? "";
  const leafName = decodeLeafName(sign.imageUrl ?? "");

  // 1. Exact filename match from the canonical frontend files
  if (leafName && PATH_BY_FILENAME.has(leafName)) {
    const resolved = PATH_BY_FILENAME.get(leafName);
    return (resolved && convertToPublicImageUrl(resolved)) ?? "";
  }

  // 2. Unique sign-code match when the backend filename is outdated or mojibake
  if (signCode) {
    const matches = CANONICAL_PATHS.filter((path) =>
      matchesSignCode(path, signCode),
    );

    if (matches.length === 1) {
      return convertToPublicImageUrl(matches[0]) ?? "";
    }

    if (matches.length > 1) {
      const signNames = extractSignNames(sign);
      const nameMatches = matches.filter((path) => {
        const normalizedFilename = normalizeText(path.split("/").pop() ?? "");
        return signNames.some((name) => normalizedFilename.includes(name));
      });

      if (nameMatches.length === 1) {
        return convertToPublicImageUrl(nameMatches[0]) ?? "";
      }
    }
  }

  // 3. No image candidate: let UI render neutral fallback block (no data URI)
  return "";
}
