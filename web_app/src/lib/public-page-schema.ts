import type { FaqItem } from "@/lib/public-content";

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
  language: string;
  pageType?: "AboutPage" | "ContactPage" | "WebPage";
}) {
  const url = new URL(path, `${appUrl.replace(/\/+$/, "")}/`).toString();

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
}: {
  appUrl: string;
  path: string;
  homeLabel: string;
  currentLabel: string;
}) {
  const rootUrl = `${appUrl.replace(/\/+$/, "")}/`;
  const currentUrl = new URL(path, rootUrl).toString();

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
