"use client";

import Link from "@/components/localized-link";
import { ChevronDown, CircleHelp, MessageCircle } from "lucide-react";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { useLanguage } from "@/contexts/language-context";
import { DEFAULT_APP_URL } from "@/lib/site-copy";
import {
  getFaqContent,
  getPublicBreadcrumbHome,
  getPublicMetadata,
} from "@/lib/public-content";
import {
  createBreadcrumbSchema,
  createFaqSchema,
  createPublicPageSchema,
} from "@/lib/public-page-schema";
import { serializeJsonLd } from "@/lib/seo";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;

export default function FaqPage() {
  const { language, isRTL } = useLanguage();
  const content = getFaqContent(language);
  const metadata = getPublicMetadata(language, "faq");
  const homeLabel = getPublicBreadcrumbHome(language);
  const pageSchema = createPublicPageSchema({
    appUrl: APP_URL,
    path: "/faq",
    title: content.title,
    description: metadata.description,
    language,
  });
  const breadcrumbSchema = createBreadcrumbSchema({
    appUrl: APP_URL,
    path: "/faq",
    homeLabel,
    currentLabel: content.title,
    language,
  });
  const faqSchema = createFaqSchema(content.items, language);

  return (
    <main
      className="min-h-screen bg-background text-foreground"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {[pageSchema, breadcrumbSchema, faqSchema].map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
        />
      ))}

      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <Breadcrumb
          items={[
            { label: homeLabel, href: "/" },
            { label: content.title, isCurrentPage: true },
          ]}
        />

        <header className="border-b border-border pb-8 pt-2">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <CircleHelp className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-bold text-primary">
                {content.eyebrow}
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-normal sm:text-4xl">
                {content.title}
              </h1>
            </div>
          </div>
          <p className="mt-6 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
            {content.intro}
          </p>
        </header>

        <section aria-label={content.title} className="divide-y divide-border">
          {content.items.map((item) => (
            <details key={item.question} className="group py-1">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-start text-base font-bold marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <span>{item.question}</span>
                <ChevronDown
                  className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <p className="max-w-4xl pb-5 pe-10 text-[15px] leading-7 text-muted-foreground">
                {item.answer}
              </p>
            </details>
          ))}
        </section>

        <aside className="mt-8 flex flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-bold">{content.contactPrompt}</p>
          <Link
            href="/contact"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            {content.contactLabel}
          </Link>
        </aside>
      </div>
    </main>
  );
}
