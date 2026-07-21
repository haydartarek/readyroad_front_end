import type { Metadata } from "next";
import { cookies } from "next/headers";
import { HeroSection } from "@/components/home/hero-section";
import { StatsHighlights } from "@/components/home/stats-highlights";
import { FeaturesSection } from "@/components/home/features-section";
import { HowItWorksSection } from "@/components/home/how-it-works-section";
import { CategoriesPreview } from "@/components/home/categories-preview";
import { ExamCta } from "@/components/home/exam-cta";
import { ContactCtaSection } from "@/components/home/contact-cta-section";
import { StickyCTA } from "@/components/home/sticky-cta";
import { STORAGE_KEYS } from "@/lib/constants";
import {
  DEFAULT_APP_URL,
  getAlternateOpenGraphLocales,
  getHomeMetadataCopy,
  getOpenGraphLocale,
  getSharedOgImage,
  resolveSiteLocale,
} from "@/lib/site-copy";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = resolveSiteLocale(
    cookieStore.get(STORAGE_KEYS.LANGUAGE)?.value,
  );
  const copy = getHomeMetadataCopy(locale);
  const ogImage = getSharedOgImage(locale);

  return {
    title: copy.title,
    description: copy.description,
    keywords: copy.keywords,
    alternates: {
      canonical: APP_URL,
    },
    openGraph: {
      title: copy.openGraphTitle,
      description: copy.openGraphDescription,
      url: APP_URL,
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
