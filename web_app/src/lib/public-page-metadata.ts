import "server-only";

import type { Metadata } from "next";
import { cookies } from "next/headers";
import { STORAGE_KEYS, type Language } from "@/lib/constants";
import { getPublicMetadata, type PublicPageKey } from "@/lib/public-content";
import {
  DEFAULT_APP_URL,
  getAlternateOpenGraphLocales,
  getOpenGraphLocale,
  getSharedOgImage,
  resolveSiteLocale,
} from "@/lib/site-copy";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;

export async function createPublicPageMetadata(
  page: PublicPageKey,
  path: string,
): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = resolveSiteLocale(
    cookieStore.get(STORAGE_KEYS.LANGUAGE)?.value,
  ) as Language;
  const copy = getPublicMetadata(locale, page);
  const canonical = new URL(path, `${APP_URL.replace(/\/+$/, "")}/`).toString();
  const ogImage = {
    ...getSharedOgImage(locale),
    alt: copy.imageAlt,
  };

  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical },
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
    twitter: {
      card: "summary_large_image",
      title: copy.openGraphTitle,
      description: copy.openGraphDescription,
      images: [ogImage.url],
    },
    robots: { index: true, follow: true },
  };
}
