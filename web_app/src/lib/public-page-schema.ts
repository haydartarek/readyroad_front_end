import type { FaqItem } from "@/lib/public-content";
import { buildLocalizedUrl } from "@/lib/i18n-routing";
import type { SiteLocale } from "@/lib/site-copy";

export function createPublicPageSchema({
  appUrl,
  path,
  title,
  description,
  language,
  pageType = "WebPage",
}: {
  appUrl: string;
  path: string;
  title: string;
  description: string;
  language: SiteLocale;
  pageType?: "AboutPage" | "ContactPage" | "WebPage";
}) {
  const url = buildLocalizedUrl(path, language, appUrl);

  return {
    "@context": "https://schema.org",
    "@type": pageType,
    "@id": `${url}#page`,
    url,
    name: title,
    description,
    inLanguage: language,
    isPartOf: { "@id": `${appUrl.replace(/\/+$/, "")}/#website` },
    about: { "@id": `${appUrl.replace(/\/+$/, "")}/#organization` },
  };
}

export function createBreadcrumbSchema({
  appUrl,
  path,
  homeLabel,
  currentLabel,
  language,
}: {
  appUrl: string;
  path: string;
  homeLabel: string;
  currentLabel: string;
  language: SiteLocale;
}) {
  const rootUrl = buildLocalizedUrl("/", language, appUrl);
  const currentUrl = buildLocalizedUrl(path, language, appUrl);

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: homeLabel,
        item: rootUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: currentLabel,
        item: currentUrl,
      },
    ],
  };
}

export function createFaqSchema(items: FaqItem[], language: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: language,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
