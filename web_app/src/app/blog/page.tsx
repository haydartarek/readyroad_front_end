import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowRight, BookOpenText, CalendarDays } from "lucide-react";
import { formatArticleDate } from "@/app/blog/blog-format";
import { buildLocalizedUrl, localizePathname } from "@/lib/i18n-routing";
import { getLocalizedAlternates } from "@/lib/localized-seo";
import { translateMessage } from "@/lib/messages";
import { getPublicArticles } from "@/lib/server/articles";
import { getRequestLocale } from "@/lib/server/request-locale";
import {
  DEFAULT_APP_URL,
  getAlternateOpenGraphLocales,
  getOpenGraphLocale,
  getSharedOgImage,
} from "@/lib/site-copy";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const title = translateMessage(locale, "blog.title");
  const description = translateMessage(locale, "blog.introduction");
  const canonical = buildLocalizedUrl("/blog", locale, APP_URL);
  const image = { ...getSharedOgImage(locale), alt: title };

  return {
    title,
    description,
    alternates: getLocalizedAlternates("/blog", locale, APP_URL),
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      siteName: "RijVia",
      locale: getOpenGraphLocale(locale),
      alternateLocale: getAlternateOpenGraphLocales(locale),
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.url],
    },
    robots: { index: true, follow: true },
  };
}

export default async function BlogPage() {
  const locale = await getRequestLocale();
  const articles = await getPublicArticles(locale);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border/50 bg-muted/25">
        <div className="container mx-auto max-w-6xl px-4 py-10 text-center sm:px-6 md:py-14">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
            <BookOpenText className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="text-sm font-bold text-primary">
            {translateMessage(locale, "blog.eyebrow")}
          </p>
          <h1 className="mt-2 text-balance text-3xl font-black tracking-normal sm:text-4xl">
            {translateMessage(locale, "blog.title")}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-pretty text-sm leading-7 text-muted-foreground sm:text-base">
            {translateMessage(locale, "blog.introduction")}
          </p>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-12">
        {articles.length === 0 ? (
          <div className="mx-auto max-w-xl py-16 text-center">
            <h2 className="text-xl font-bold">
              {translateMessage(locale, "blog.empty_title")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {translateMessage(locale, "blog.empty_description")}
            </p>
          </div>
        ) : (
          <div data-testid="blog-article-grid" className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {articles.map((article) => {
              const href = localizePathname(
                `/blog/${encodeURIComponent(article.slug)}`,
                locale,
              );

              return (
                <article
                  key={`${article.language}:${article.slug}`}
                  className="flex min-w-0 flex-col rounded-lg border border-border/60 bg-card shadow-sm transition-colors hover:border-primary/25"
                >
                  {article.image ? (
                    <Link href={href} className="relative block aspect-video bg-muted">
                      <Image
                        src={article.image.cardUrl}
                        alt={article.image.altText}
                        fill
                        sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 280px"
                        className="rounded-t-lg object-cover"
                      />
                    </Link>
                  ) : null}
                  <div className="flex flex-1 flex-col p-4">
                  <div className="flex min-w-0 items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <time dateTime={article.publishedAt}>
                      {formatArticleDate(article.publishedAt, locale)}
                    </time>
                  </div>
                  <h2 className="mt-4 break-words text-lg font-black leading-snug tracking-normal">
                    <Link href={href} className="outline-none hover:text-primary focus-visible:text-primary">
                      {article.title}
                    </Link>
                  </h2>
                  <p className="mt-3 flex-1 break-words text-sm leading-7 text-muted-foreground">
                    {article.summary}
                  </p>
                  <Link
                    href={href}
                    className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                  >
                    {translateMessage(locale, "blog.read_article")}
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                  </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
