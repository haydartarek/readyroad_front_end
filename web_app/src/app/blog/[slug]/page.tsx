import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { articleParagraphs, formatArticleDate } from "@/app/blog/blog-format";
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

export async function generateMetadata({ params }: BlogArticlePageProps): Promise<Metadata> {
  const [{ slug }, locale] = await Promise.all([params, getRequestLocale()]);
  const article = await getPublicArticle(locale, slug);

  return article
    ? createArticleMetadata(article, locale)
    : { robots: { index: false, follow: false } };
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const [{ slug }, locale] = await Promise.all([params, getRequestLocale()]);
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

        <div className="mx-auto mt-8 max-w-[70ch] space-y-6 text-start text-base leading-8 md:mt-10 md:text-lg md:leading-9">
          {articleParagraphs(article.body).map((paragraph, index) => (
            <p key={`${index}:${paragraph.slice(0, 32)}`} className="whitespace-pre-line break-words">
              {paragraph}
            </p>
          ))}
        </div>
      </article>
    </main>
  );
}
