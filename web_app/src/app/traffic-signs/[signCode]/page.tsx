import TrafficSignDetailClient from "@/app/traffic-signs/[signCode]/sign-detail-client";
import { getPublicTrafficSign } from "@/lib/server/public-catalog";
import RelatedLearningArticles from "@/components/content/related-learning-articles";
import { localizePathname } from "@/lib/i18n-routing";
import { getRelatedPublicArticles } from "@/lib/server/articles";
import { getRequestLocale } from "@/lib/server/request-locale";

type TrafficSignDetailPageProps = Readonly<{
  params: Promise<{ signCode: string }>;
}>;

export default async function TrafficSignDetailPage({
  params,
}: TrafficSignDetailPageProps) {
  const { signCode } = await params;
  const locale = await getRequestLocale();
  const targetPath = localizePathname(
    `/traffic-signs/${encodeURIComponent(signCode)}`,
    locale,
  );
  const [sign, relatedArticles] = await Promise.all([
    getPublicTrafficSign(signCode),
    getRelatedPublicArticles(locale, targetPath),
  ]);

  return (
    <>
      <TrafficSignDetailClient initialSign={sign} />
      <RelatedLearningArticles articles={relatedArticles} locale={locale} />
    </>
  );
}
