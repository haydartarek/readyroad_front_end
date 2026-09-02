import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, CalendarDays } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { formatArticleDate } from "@/app/blog/blog-format";
import ArticleMarkdown from "@/components/blog/ArticleMarkdown";
import ArticleLearningCards from "@/components/blog/ArticleLearningCards";
import { localizePathname } from "@/lib/i18n-routing";
import { createArticleMetadata } from "@/lib/article-metadata";
import { createArticleStructuredData } from "@/lib/article-structured-data";
import { translateMessage } from "@/lib/messages";
import { serializeJsonLd } from "@/lib/seo";
import { getPublicArticle } from "@/lib/server/articles";
import { getRequestLocale } from "@/lib/server/request-locale";

type BlogArticlePageProps = Readonly<{
  params: Promise<{ slug: string }>;
}>;

function decodeArticleSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    notFound();
  }
}

export async function generateMetadata({ params }: BlogArticlePageProps): Promise<Metadata> {
  const [{ slug: routeSlug }, locale] = await Promise.all([params, getRequestLocale()]);
  const slug = decodeArticleSlug(routeSlug);
  const article = await getPublicArticle(locale, slug);

  if (!article) {
    notFound();
  }

  return createArticleMetadata(article, locale);
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const [{ slug: routeSlug }, locale] = await Promise.all([params, getRequestLocale()]);
  const slug = decodeArticleSlug(routeSlug);
  const article = await getPublicArticle(locale, slug);

  if (!article) {
    notFound();
  }

  if (article.slug !== slug) {
    redirect(
      localizePathname(
        `/blog/${encodeURIComponent(article.slug)}`,
        locale,
      ),
    );
  }

  const structuredData = createArticleStructuredData(
    article,
    locale,
    translateMessage(locale, "blog.eyebrow"),
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <script
        id="article-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
      />
      <article className="container mx-auto max-w-3xl px-4 py-8 sm:px-6 md:py-12">
        <Link
          href={localizePathname("/blog", locale)}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          {translateMessage(locale, "blog.back")}
        </Link>

        <header className="mt-6 border-b border-border/60 pb-7 text-center md:pb-9">
          <h1 className="text-balance break-words text-3xl font-black leading-tight tracking-normal sm:text-4xl">
            {article.title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl break-words text-base leading-8 text-muted-foreground">
            {article.summary}
          </p>
          <div className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            <span>{translateMessage(locale, "blog.published")}</span>
            <time dateTime={article.publishedAt}>
              {formatArticleDate(article.publishedAt, locale)}
            </time>
          </div>
        </header>

        {article.image ? (
          <figure className="mx-auto mt-8 max-w-4xl md:mt-10">
            <Image
              src={article.image.heroUrl}
              alt={article.image.altText}
              width={1920}
              height={1080}
              priority
              sizes="(max-width: 768px) 100vw, 896px"
              className="h-auto w-full rounded-2xl border border-border/60 object-cover shadow-sm"
            />
            <figcaption className="mt-3 text-center text-xs leading-5 text-muted-foreground">
              {article.image.caption ? <span className="me-2">{article.image.caption}</span> : null}
              {article.image.sourceUrl ? (
                <a
                  href={article.image.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-primary hover:underline"
                >
                  {translateMessage(locale, "blog.photo_credit", {
                    photographer: article.image.photographerName,
                    source: article.image.sourcePlatform,
                  })}
                </a>
              ) : (
                <span className="font-semibold">
                  {translateMessage(locale, "blog.photo_credit", {
                    photographer: article.image.photographerName,
                    source: article.image.licenseName,
                  })}
                </span>
              )}
            </figcaption>
          </figure>
        ) : null}

        <ArticleMarkdown
          body={article.body}
          typography={article.typography}
          afterSecondParagraph={<ArticleLearningCards locale={locale} />}
          className="mx-auto mt-8 max-w-[70ch] text-start leading-8 md:mt-10 md:leading-9"
        />

        {article.internalLinks.length ? (
          <section className="mx-auto mt-10 max-w-[70ch] border-t border-border/60 pt-7">
            <h2 className="text-xl font-black">
              {translateMessage(locale, "blog.continue_learning")}
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {article.internalLinks.map((internalLink) => (
                <li key={internalLink.targetPath} className="min-w-0">
                  <Link
                    href={internalLink.targetPath}
                    className="flex min-h-12 min-w-0 items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 text-sm font-bold transition-colors hover:border-primary/25 hover:bg-primary/[0.05] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                  >
                    <span className="min-w-0 break-words">{internalLink.anchorText}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 rtl:rotate-180" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>
    </main>
  );
}
