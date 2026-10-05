import {
  resolveRijviaMediaUrl,
} from "./image-utils";

export function resolveLessonImageUrl(
  src: string | null | undefined,
): string | null {
  return resolveRijviaMediaUrl(src);
}
