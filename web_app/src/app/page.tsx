import { getRequestLocale } from "@/lib/server/request-locale";
import type { Metadata } from "next";
import { HeroSection } from "@/components/home/hero-section";
import { HomeLessonsOverview } from "@/components/home/home-lessons-overview";
import { getHomeLessonsOverview } from "@/lib/server/home-lessons-overview";
import { FeaturesSection } from "@/components/home/features-section";
import { CategoriesPreview } from "@/components/home/categories-preview";
import { PricingSection } from "@/components/home/pricing-section";
import { ExamCta } from "@/components/home/exam-cta";
import {
  DEFAULT_APP_URL,
  getAlternateOpenGraphLocales,
  getHomeMetadataCopy,
  getOpenGraphLocale,
  getSharedOgImage,
} from "@/lib/site-copy";
import { buildLocalizedUrl } from "@/lib/i18n-routing";
import { getLocalizedAlternates } from "@/lib/localized-seo";
import { toBrandedMetadataTitle } from "@/lib/seo";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = getHomeMetadataCopy(locale);
  const ogImage = getSharedOgImage(locale);
  const canonical = buildLocalizedUrl("/", locale, APP_URL);

  return {
    title: { absolute: toBrandedMetadataTitle(copy.title) },
    description: copy.description,
    keywords: copy.keywords,
    alternates: getLocalizedAlternates("/", locale, APP_URL),
    openGraph: {
      title: toBrandedMetadataTitle(copy.openGraphTitle),
      description: copy.openGraphDescription,
      url: canonical,
      siteName: "Rijvia",
      locale: getOpenGraphLocale(locale),
      alternateLocale: getAlternateOpenGraphLocales(locale),
      images: [ogImage],
      type: "website",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

type HomeProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const resumeCheckout = params.resumeCheckout === "1";

  if (resumeCheckout) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <main>
          <PricingSection resumeCheckout />
        </main>
      </div>
    );
  }

  const lessonsOverview = await getHomeLessonsOverview();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main>
        <HeroSection />
        <HomeLessonsOverview lessons={lessonsOverview} />
        <FeaturesSection />
        <CategoriesPreview />
        <PricingSection />
        <ExamCta />
      </main>

    </div>
  );
}
