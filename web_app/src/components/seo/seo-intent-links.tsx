"use client";

import Link from "@/components/localized-link";
import { useLanguage } from "@/contexts/language-context";
import {
  getSeoIntentCopy,
  type SeoIntentPage,
} from "@/lib/seo-intent-copy";

type SeoIntentLinksProps = {
  page: SeoIntentPage;
  excludeHrefs?: readonly string[];
};

export function SeoIntentLinks({
  page,
  excludeHrefs = [],
}: SeoIntentLinksProps) {
  const { language } = useLanguage();
  const copy = getSeoIntentCopy(language, page);
  const excluded = new Set(excludeHrefs);

  const links = copy.links.filter(
    (link) => !excluded.has(link.href),
  );

  if (links.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label={copy.relatedLabel}
      data-testid={`seo-intent-links-${page}`}
      className="rounded-2xl border border-border/60 bg-card/70 px-4 py-4 shadow-sm sm:px-5"
    >
      <p className="text-sm font-black text-foreground">
        {copy.relatedLabel}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="inline-flex min-h-10 items-center rounded-full border border-primary/15 bg-background px-4 py-2 text-sm font-semibold leading-5 text-secondary transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
