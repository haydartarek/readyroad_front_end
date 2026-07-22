import type { Metadata } from "next";
import { cookies } from "next/headers";
import { STORAGE_KEYS } from "@/lib/constants";
import { getLocalizedTrafficSignSeo } from "@/lib/learning-seo-copy";
import {
  DEFAULT_APP_URL,
  getAlternateOpenGraphLocales,
  getOpenGraphLocale,
  resolveSiteLocale,
} from "@/lib/site-copy";
import { buildAbsoluteUrl, serializeJsonLd, toMetadataDescription } from "@/lib/seo";
import { getPublicTrafficSign } from "@/lib/server/public-catalog";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;

type SignLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{ signCode: string }>;
}>;

export async function generateMetadata({
  params,
}: Pick<SignLayoutProps, "params">): Promise<Metadata> {
  const { signCode } = await params;
  const sign = await getPublicTrafficSign(signCode);

  if (!sign) {
    return {
      title: { absolute: "Traffic Sign Not Found | ReadyRoad" },
      robots: { index: false, follow: false },
    };
  }

  const cookieStore = await cookies();
  const locale = resolveSiteLocale(
    cookieStore.get(STORAGE_KEYS.LANGUAGE)?.value,
  );
  const copy = getLocalizedTrafficSignSeo(sign, locale);

  const routeCode = sign.routeCode || sign.signCode;
  const canonical = buildAbsoluteUrl(
    `/traffic-signs/${encodeURIComponent(routeCode)}`,
    APP_URL,
  );
  const description = toMetadataDescription(
    copy.description ? `${sign.signCode}: ${copy.description}` : "",
    copy.fallbackDescription,
  );
  const image = buildAbsoluteUrl(sign.imageUrl, APP_URL);
  const title = copy.title;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "ReadyRoad",
      locale: getOpenGraphLocale(locale),
      alternateLocale: getAlternateOpenGraphLocales(locale),
      type: "article",
      images: [{ url: image, alt: copy.imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    robots: { index: true, follow: true },
  };
}

export default async function SignLayout({
  children,
  params,
}: SignLayoutProps) {
  const { signCode } = await params;
  const sign = await getPublicTrafficSign(signCode);

  if (!sign) {
    return children;
  }

  const cookieStore = await cookies();
  const locale = resolveSiteLocale(
    cookieStore.get(STORAGE_KEYS.LANGUAGE)?.value,
  );
  const copy = getLocalizedTrafficSignSeo(sign, locale);

  const routeCode = sign.routeCode || sign.signCode;
  const canonical = buildAbsoluteUrl(
    `/traffic-signs/${encodeURIComponent(routeCode)}`,
    APP_URL,
  );
  const image = buildAbsoluteUrl(sign.imageUrl, APP_URL);
  const description = toMetadataDescription(
    copy.description,
    copy.fallbackDescription,
  );
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: copy.homeLabel,
          item: APP_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: copy.indexLabel,
          item: buildAbsoluteUrl("/traffic-signs", APP_URL),
        },
        {
          "@type": "ListItem",
          position: 3,
          name: `${sign.signCode}: ${copy.name}`,
          item: canonical,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "LearningResource",
      name: `${sign.signCode}: ${copy.name}`,
      description,
      url: canonical,
      image,
      inLanguage: ["en", "nl", "fr", "ar"],
      learningResourceType: copy.learningResourceType,
      educationalUse: copy.educationalUse,
      about: {
        "@type": "DefinedTerm",
        name: copy.name,
        termCode: sign.signCode,
      },
      isPartOf: { "@id": `${APP_URL}/#website` },
    },
  ];

  return (
    <>
      {schemas.map((schema) => (
        <script
          key={schema["@type"]}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
        />
      ))}
      {children}
    </>
  );
}
