import TrafficSignsClient from "@/app/traffic-signs/traffic-signs-client";
import { getPublicTrafficSigns } from "@/lib/server/public-catalog";

export default async function TrafficSignsPage() {
  const signs = await getPublicTrafficSigns();

  return <TrafficSignsClient initialSigns={signs} />;
}
