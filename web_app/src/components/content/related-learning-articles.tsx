import Link from "next/link";
import { ArrowRight, BookOpenText } from "lucide-react";
import { localizePathname } from "@/lib/i18n-routing";
import { translateMessage } from "@/lib/messages";
import type { PublicArticleSummary } from "@/lib/server/articles";
import type { SiteLocale } from "@/lib/site-copy";

export default function RelatedLearningArticles({
  articles,
  locale,
}: Readonly<{
  articles: PublicArticleSummary[];
  locale: SiteLocale;
}>) {
  if (!articles.length) {
    return null;
  }

  return (
    <section className="bg-muted/25 py-8" data-testid="related-learning-articles">
      <div className="container mx-auto px-4 sm:px-6">
        <h2 className="flex items-center justify-center gap-2 text-center text-xl font-black">
          <BookOpenText className="h-5 w-5 text-primary" aria-hidden="true" />
          {translateMessage(locale, "blog.related_learning")}
        </h2>
        <div className="mx-auto mt-5 grid max-w-4xl gap-3 md:grid-cols-3">
          {articles.map((article) => (
            <Link
              key={`${article.language}:${article.slug}`}
              href={localizePathname(`/blog/${encodeURIComponent(article.slug)}`, locale)}
              className="flex min-h-24 min-w-0 items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-4 py-4 text-sm font-bold shadow-sm transition-colors hover:border-primary/25 hover:bg-primary/[0.05] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
            >
              <span className="min-w-0 break-words">{article.title}</span>
              <ArrowRight className="h-4 w-4 shrink-0 rtl:rotate-180" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
