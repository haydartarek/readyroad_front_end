import { getRequestLocale } from "@/lib/server/request-locale";
import type { Metadata } from "next";
import { getTrafficSignsSeoCopy } from "@/lib/learning-seo-copy";
import {
  DEFAULT_APP_URL,
  getAlternateOpenGraphLocales,
  getOpenGraphLocale,
} from "@/lib/site-copy";
import { buildLocalizedUrl } from "@/lib/i18n-routing";
import { getLocalizedAlternates } from "@/lib/localized-seo";
import { toBrandedMetadataTitle } from "@/lib/seo";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = getTrafficSignsSeoCopy(locale);
  const canonical = buildLocalizedUrl("/traffic-signs", locale, APP_URL);
  const isEnglishTrafficSignsCtrPilot = locale === "en";
  const seoTitle = toBrandedMetadataTitle(
    isEnglishTrafficSignsCtrPilot
      ? "Belgian Road Signs & Traffic Signs Explained"
      : copy.title,
  );
  const seoDescription = isEnglishTrafficSignsCtrPilot
    ? "Explore 184 Belgian road and traffic signs with clear meanings. Learn priority, warning and prohibition signs for the Belgian driving theory exam."
    : copy.description;
  const socialTitle = isEnglishTrafficSignsCtrPilot
    ? seoTitle
    : toBrandedMetadataTitle(copy.openGraphTitle);
  const socialDescription = isEnglishTrafficSignsCtrPilot
    ? seoDescription
    : copy.openGraphDescription;

  return {
    title: { absolute: seoTitle },
    description: seoDescription,
    keywords: copy.keywords,
    alternates: getLocalizedAlternates("/traffic-signs", locale, APP_URL),
    openGraph: {
      title: socialTitle,
      description: socialDescription,
      url: canonical,
      siteName: "Rijvia",
      locale: getOpenGraphLocale(locale),
      alternateLocale: getAlternateOpenGraphLocales(locale),
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: copy.imageAlt,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: socialDescription,
      images: ["/opengraph-image"],
    },
  };
}

export default async function TrafficSignsLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {children}
</main>
    </div>
  );
}
