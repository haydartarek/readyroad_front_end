"use client";

import Link from "@/components/localized-link";
import type { LucideIcon } from "lucide-react";
import { ExternalLink } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useLanguage } from "@/contexts/language-context";
import { DEFAULT_APP_URL } from "@/lib/site-copy";
import {
  getPublicBreadcrumbHome,
  getPublicDocument,
  getPublicMetadata,
  type PublicDocumentKey,
} from "@/lib/public-content";
import {
  createBreadcrumbSchema,
  createPublicPageSchema,
} from "@/lib/public-page-schema";
import { serializeJsonLd } from "@/lib/seo";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;

export function PublicDocumentPage({
  page,
  path,
  icon: Icon,
}: {
  page: PublicDocumentKey;
  path: string;
  icon: LucideIcon;
}) {
  const { language, isRTL } = useLanguage();
  const document = getPublicDocument(language, page);
  const metadata = getPublicMetadata(language, page);
  const homeLabel = getPublicBreadcrumbHome(language);
  const pageSchema = createPublicPageSchema({
    appUrl: APP_URL,
    path,
    title: document.title,
    description: metadata.description,
    language,
    pageType: page === "about" ? "AboutPage" : "WebPage",
  });
  const breadcrumbSchema = createBreadcrumbSchema({
    appUrl: APP_URL,
    path,
    homeLabel,
    currentLabel: document.title,
    language,
  });

  return (
    <main
      className="min-h-screen bg-background text-foreground"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(pageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbSchema) }}
      />

      <div className="mx-auto min-w-0 w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <Breadcrumb
          items={[
            { label: homeLabel, href: "/" },
            { label: document.title, isCurrentPage: true },
          ]}
        />

        <header className="min-w-0 border-b border-border pb-8 pt-2">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="break-words text-sm font-bold text-primary [overflow-wrap:anywhere]">
                {document.eyebrow}
              </p>
              <h1 className="mt-1 max-w-full break-words text-2xl font-black tracking-normal [overflow-wrap:anywhere] sm:text-4xl">
                {document.title}
              </h1>
              <p className="mt-2 break-words text-sm text-muted-foreground [overflow-wrap:anywhere]">
                {document.lastUpdated}
              </p>
            </div>
          </div>
          <p className="mt-6 max-w-3xl break-words text-base leading-8 text-muted-foreground [overflow-wrap:anywhere] sm:text-lg">
            {document.intro}
          </p>
        </header>

        <div className="divide-y divide-border">
          {document.sections.map((section, index) => {
            const headingId = `${page}-section-${index + 1}`;
            return (
              <section
                key={section.title}
                aria-labelledby={headingId}
                className="min-w-0 py-8"
              >
                <h2
                  id={headingId}
                  className="break-words text-xl font-black tracking-normal [overflow-wrap:anywhere]"
                >
                  {section.title}
                </h2>

                <div className="mt-4 min-w-0 max-w-4xl space-y-4 break-words text-[15px] leading-7 text-muted-foreground [overflow-wrap:anywhere]">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>

                {section.items?.length ? (
                  <ul className="mt-5 min-w-0 max-w-4xl space-y-3">
                    {section.items.map((item) => (
                      <li key={item} className="flex gap-3 text-sm leading-7">
                        <span
                          className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                          aria-hidden="true"
                        />
                        <span className="min-w-0 break-words text-muted-foreground [overflow-wrap:anywhere]">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {section.references?.length ? (
                  <div className="mt-5 flex min-w-0 flex-wrap gap-3">
                    {section.references.map((reference) => (
                      <Link
                        key={reference.id}
                        href={reference.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-10 min-w-0 max-w-full items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="min-w-0 break-words [overflow-wrap:anywhere]">
                          {reference.label}
                        </span>
                        <ExternalLink
                          className="h-4 w-4 shrink-0"
                          aria-hidden="true"
                        />
                      </Link>
                    ))}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
