import { getRequestLocale } from "@/lib/server/request-locale";
import type { Metadata } from "next";
import { HeroSection } from "@/components/home/hero-section";
import { StatsHighlights } from "@/components/home/stats-highlights";
import { FeaturesSection } from "@/components/home/features-section";
import { HowItWorksSection } from "@/components/home/how-it-works-section";
import { CategoriesPreview } from "@/components/home/categories-preview";
import { ExamCta } from "@/components/home/exam-cta";
import { ContactCtaSection } from "@/components/home/contact-cta-section";
import { StickyCTA } from "@/components/home/sticky-cta";
import {
  DEFAULT_APP_URL,
  getAlternateOpenGraphLocales,
  getHomeMetadataCopy,
  getOpenGraphLocale,
  getSharedOgImage,
} from "@/lib/site-copy";
import { buildLocalizedUrl } from "@/lib/i18n-routing";
import { getLocalizedAlternates } from "@/lib/localized-seo";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = getHomeMetadataCopy(locale);
  const ogImage = getSharedOgImage(locale);
  const canonical = buildLocalizedUrl("/", locale, APP_URL);

  return {
    title: copy.title,
    description: copy.description,
    keywords: copy.keywords,
    alternates: getLocalizedAlternates("/", locale, APP_URL),
    openGraph: {
      title: copy.openGraphTitle,
      description: copy.openGraphDescription,
      url: canonical,
      siteName: "ReadyRoad",
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

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main>
        <HeroSection />
        <StatsHighlights />
        <FeaturesSection />
        <HowItWorksSection />
        <CategoriesPreview />
        <ExamCta />
        <ContactCtaSection />
      </main>

      <StickyCTA />
    </div>
  );
}
