import type { Metadata } from "next";
import { VideoGallery } from "@/components/videos/video-gallery";
import { buildLocalizedUrl } from "@/lib/i18n-routing";
import { getLocalizedAlternates } from "@/lib/localized-seo";
import { translateMessage } from "@/lib/messages";
import { serializeJsonLd } from "@/lib/seo";
import { getRequestLocale } from "@/lib/server/request-locale";
import { getYouTubeVideoPage } from "@/lib/server/youtube";
import {
  DEFAULT_APP_URL,
  getAlternateOpenGraphLocales,
  getOpenGraphLocale,
  getSharedOgImage,
} from "@/lib/site-copy";
import type { YouTubeVideoPage } from "@/lib/youtube";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const title = translateMessage(locale, "videos.metadata_title");
  const description = translateMessage(locale, "videos.metadata_description");
  const canonical = buildLocalizedUrl("/videos", locale, APP_URL);
  const ogImage = getSharedOgImage(locale);

  return {
    title: { absolute: title },
    description,
    alternates: getLocalizedAlternates("/videos", locale, APP_URL),
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "RijVia",
      locale: getOpenGraphLocale(locale),
      alternateLocale: getAlternateOpenGraphLocales(locale),
      images: [ogImage],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage.url],
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
export default async function VideosPage() {
  const locale = await getRequestLocale();
  let initialData: YouTubeVideoPage | null = null;
  let initialError = false;

  try {
    initialData = await getYouTubeVideoPage();
  } catch {
    initialError = true;
  }

  const pageUrl = buildLocalizedUrl("/videos", locale, APP_URL);
  const pageTitle = translateMessage(locale, "videos.hero_title");
  const pageDescription = translateMessage(
    locale,
    "videos.metadata_description",
  );
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}#page`,
        url: pageUrl,
        name: pageTitle,
        description: pageDescription,
        inLanguage: locale,
        isPartOf: { "@id": `${APP_URL.replace(/\/+$/, "")}/#website` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: translateMessage(locale, "nav.home"),
            item: buildLocalizedUrl("/", locale, APP_URL),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: translateMessage(locale, "videos.page_name"),
            item: pageUrl,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
      />
      <VideoGallery initialData={initialData} initialError={initialError} />
    </>
  );
}
