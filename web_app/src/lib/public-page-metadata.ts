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
import { normalizeSeoBrand, toBrandedMetadataTitle } from "@/lib/seo";

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
    title: { absolute: toBrandedMetadataTitle(copy.title) },
    description: normalizeSeoBrand(copy.description),
    alternates: getLocalizedAlternates(path, locale, APP_URL),
    openGraph: {
      title: toBrandedMetadataTitle(copy.openGraphTitle),
      description: normalizeSeoBrand(copy.openGraphDescription),
      url: canonical,
      siteName: "Rijvia",
      locale: getOpenGraphLocale(locale),
      alternateLocale: getAlternateOpenGraphLocales(locale),
      images: [ogImage],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: toBrandedMetadataTitle(copy.openGraphTitle),
      description: normalizeSeoBrand(copy.openGraphDescription),
      images: [ogImage.url],
    },
    robots: { index: true, follow: true },
  };
}
