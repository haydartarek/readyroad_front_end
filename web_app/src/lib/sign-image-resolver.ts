import type { TrafficSign } from "@/lib/types";
import { getSignImageUrl } from "@/lib/image-utils";

export function resolveTrafficSignImage(
  sign: Pick<TrafficSign, "imageUrl">,
): string {
  return getSignImageUrl(sign.imageUrl) ?? "";
}
