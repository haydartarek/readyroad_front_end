import { getRequestLocale } from "@/lib/server/request-locale";
import "server-only";

import type { Metadata } from "next";
import { type Language } from "@/lib/constants";
import { getPublicMetadata, type PublicPageKey } from "@/lib/public-content";
import {
  DEFAULT_APP_URL,
  getAlternateOpenGraphLocales,
  getOpenGraphLocale,
  getSharedOgImage,
} from "@/lib/site-copy";
import { buildLocalizedUrl } from "@/lib/i18n-routing";
import { getLocalizedAlternates } from "@/lib/localized-seo";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;

export async function createPublicPageMetadata(
  page: PublicPageKey,
  path: string,
): Promise<Metadata> {
  const locale = (await getRequestLocale()) as Language;
  const copy = getPublicMetadata(locale, page);
  const canonical = buildLocalizedUrl(path, locale, APP_URL);
  const ogImage = {
    ...getSharedOgImage(locale),
    alt: copy.imageAlt,
  };

  return {
    title: copy.title,
    description: copy.description,
    alternates: getLocalizedAlternates(path, locale, APP_URL),
    openGraph: {
      title: copy.openGraphTitle,
      description: copy.openGraphDescription,
      url: canonical,
      siteName: "RijVia",
      locale: getOpenGraphLocale(locale),
      alternateLocale: getAlternateOpenGraphLocales(locale),
      images: [ogImage],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: copy.openGraphTitle,
      description: copy.openGraphDescription,
      images: [ogImage.url],
    },
    robots: { index: true, follow: true },
  };
}
