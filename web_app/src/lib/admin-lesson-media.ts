import type { AdminLessonMediaAsset } from "@/lib/admin-lessons";
import { convertToPublicImageUrl } from "@/lib/image-utils";

export function adminLessonMediaUrl(
  asset:
    | AdminLessonMediaAsset
    | null
    | undefined,
): string | null {
  const storageKey =
    asset?.storageKey?.trim();

  if (!storageKey) {
    return null;
  }

  const cleanKey =
    storageKey.replace(/^\/+/, "");

  const relativeUrl =
    cleanKey.startsWith("images/")
      ? `/${cleanKey}`
      : `/images/${cleanKey}`;

  return (
    convertToPublicImageUrl(
      relativeUrl,
    ) ?? null
  );
}
