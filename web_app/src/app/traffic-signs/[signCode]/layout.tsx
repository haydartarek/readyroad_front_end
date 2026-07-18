import type { Metadata } from "next";
import { DEFAULT_APP_URL } from "@/lib/site-copy";
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

  const routeCode = sign.routeCode || sign.signCode;
  const canonical = buildAbsoluteUrl(
    `/traffic-signs/${encodeURIComponent(routeCode)}`,
    APP_URL,
  );
  const description = toMetadataDescription(
    sign.descriptionEn || sign.summaryEn,
    `Learn the meaning and correct driver response for Belgian traffic sign ${sign.signCode}.`,
  );
  const image = buildAbsoluteUrl(sign.imageUrl, APP_URL);
  const title = `${sign.signCode}: ${sign.nameEn} | ReadyRoad`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "ReadyRoad",
      locale: "en_BE",
      alternateLocale: ["nl_BE", "fr_BE", "ar_BE"],
      type: "article",
      images: [{ url: image, alt: `${sign.signCode}: ${sign.nameEn}` }],
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

  const routeCode = sign.routeCode || sign.signCode;
  const canonical = buildAbsoluteUrl(
    `/traffic-signs/${encodeURIComponent(routeCode)}`,
    APP_URL,
  );
  const image = buildAbsoluteUrl(sign.imageUrl, APP_URL);
  const description = sign.descriptionEn || sign.summaryEn;
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: APP_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Belgian Traffic Signs",
          item: buildAbsoluteUrl("/traffic-signs", APP_URL),
        },
        {
          "@type": "ListItem",
          position: 3,
          name: `${sign.signCode}: ${sign.nameEn}`,
          item: canonical,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "LearningResource",
      name: `${sign.signCode}: ${sign.nameEn}`,
      description,
      url: canonical,
      image,
      inLanguage: ["en", "nl", "fr", "ar"],
      learningResourceType: "Traffic sign reference",
      educationalUse: "Study and revision",
      about: {
        "@type": "DefinedTerm",
        name: sign.nameEn,
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
