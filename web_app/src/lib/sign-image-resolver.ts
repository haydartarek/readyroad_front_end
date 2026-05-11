import { TrafficSign } from "@/lib/types";
import { getSignImageUrl } from "@/lib/image-utils";

export function resolveTrafficSignImage(sign: TrafficSign): string {
  return getSignImageUrl(sign.imageUrl) ?? "";
}
