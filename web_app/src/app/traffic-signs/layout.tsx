import { getRequestLocale } from "@/lib/server/request-locale";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { SeoIntentSection } from "@/components/seo/seo-intent-section";
import { getTrafficSignsSeoCopy } from "@/lib/learning-seo-copy";
import {
  DEFAULT_APP_URL,
  getAlternateOpenGraphLocales,
  getOpenGraphLocale,
} from "@/lib/site-copy";
import { buildLocalizedUrl } from "@/lib/i18n-routing";
import { getLocalizedAlternates } from "@/lib/localized-seo";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = getTrafficSignsSeoCopy(locale);
  const canonical = buildLocalizedUrl("/traffic-signs", locale, APP_URL);

  return {
    title: copy.title,
    description: copy.description,
    keywords: copy.keywords,
    alternates: getLocalizedAlternates("/traffic-signs", locale, APP_URL),
    openGraph: {
      title: copy.openGraphTitle,
      description: copy.openGraphDescription,
      url: canonical,
      siteName: "RijVia",
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
      title: copy.openGraphTitle,
      description: copy.openGraphDescription,
      images: ["/opengraph-image"],
    },
  };
}

export default async function TrafficSignsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = (await headers()).get("x-rijvia-pathname") || "/traffic-signs";

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {children}
        {pathname === "/traffic-signs" ? (
          <SeoIntentSection page="trafficSigns" />
        ) : null}
      </main>
    </div>
  );
}
