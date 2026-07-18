import TrafficSignsClient from "@/app/traffic-signs/traffic-signs-client";
import { getPublicTrafficSignCatalog } from "@/lib/server/public-catalog";

export default async function TrafficSignsPage() {
  const signs = await getPublicTrafficSignCatalog();

  return <TrafficSignsClient initialSigns={signs} />;
}
