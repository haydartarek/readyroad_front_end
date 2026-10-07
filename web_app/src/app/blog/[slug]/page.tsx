import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import ArticleMarkdown from "@/components/blog/ArticleMarkdown";
import ArticleLearningCards from "@/components/blog/ArticleLearningCards";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import {
  PageHeroDescription,
  PageHeroSurface,
  PageHeroTitle,
} from "@/components/ui/page-surface";
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
    translateMessage(locale, "nav.blog"),
  );
  const imageCaption = article.image?.caption?.trim();
  const imageSourceUrl = article.image?.sourceUrl?.trim();
  const photographer = article.image?.photographerName?.trim();
  const imageCreditSource = (imageSourceUrl
    ? article.image?.sourcePlatform
    : article.image?.licenseName)?.trim();
  const imageCredit = photographer && imageCreditSource
    ? translateMessage(locale, "blog.photo_credit", {
        photographer,
        source: imageCreditSource,
      })
    : null;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <script
        id="article-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
      />
      <article className="container mx-auto max-w-5xl px-4 pt-8 pb-12 sm:px-6">
        <Breadcrumb
          items={[
            {
              label: translateMessage(locale, "nav.home"),
              href: localizePathname("/", locale),
            },
            {
              label: translateMessage(locale, "nav.blog"),
              href: localizePathname("/blog", locale),
            },
            {
              label: article.title,
              isCurrentPage: true,
            },
          ]}
        />

        <PageHeroSurface>
          <PageHeroTitle className="text-balance">
            {article.title}
          </PageHeroTitle>
          <PageHeroDescription className="max-w-3xl break-words leading-8">
            {article.summary}
          </PageHeroDescription>
        </PageHeroSurface>

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
            {imageCaption || imageCredit ? (
              <figcaption className="mt-3 text-center text-xs leading-5 text-muted-foreground">
                {imageCaption ? <span className="me-2">{imageCaption}</span> : null}
                {imageCredit ? (
                  imageSourceUrl ? (
                    <a
                      href={imageSourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-primary hover:underline"
                    >
                      {imageCredit}
                    </a>
                  ) : (
                    <span className="font-semibold">{imageCredit}</span>
                  )
                ) : null}
              </figcaption>
            ) : null}
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
                    className="flex min-h-12 min-w-0 items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 text-sm font-bold transition-colors hover:border-primary/30 hover:bg-primary/[0.05] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
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
