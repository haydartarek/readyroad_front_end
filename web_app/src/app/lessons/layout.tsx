import type { Metadata } from "next";
import { cookies } from "next/headers";
import { STORAGE_KEYS } from "@/lib/constants";
import { getLessonsSeoCopy } from "@/lib/learning-seo-copy";
import {
  DEFAULT_APP_URL,
  getAlternateOpenGraphLocales,
  getOpenGraphLocale,
  resolveSiteLocale,
} from "@/lib/site-copy";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = resolveSiteLocale(
    cookieStore.get(STORAGE_KEYS.LANGUAGE)?.value,
  );
  const copy = getLessonsSeoCopy(locale);

  return {
    title: copy.title,
    description: copy.description,
    keywords: copy.keywords,
    alternates: { canonical: `${APP_URL}/lessons` },
    openGraph: {
      title: copy.openGraphTitle,
      description: copy.openGraphDescription,
      url: `${APP_URL}/lessons`,
      siteName: "ReadyRoad",
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

export default function LessonsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">{children}</main>
    </div>
  );
}
