import TrafficSignDetailClient from "@/app/traffic-signs/[signCode]/sign-detail-client";
import { getPublicTrafficSign } from "@/lib/server/public-catalog";

type TrafficSignDetailPageProps = Readonly<{
  params: Promise<{ signCode: string }>;
}>;

export default async function TrafficSignDetailPage({
  params,
}: TrafficSignDetailPageProps) {
  const { signCode } = await params;
  const sign = await getPublicTrafficSign(signCode);

  return <TrafficSignDetailClient initialSign={sign} />;
}
