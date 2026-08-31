import Link from "next/link";
import { localizeHref } from "@/lib/i18n-routing";
import { getRequestLocale } from "@/lib/server/request-locale";
import {
  getSeoIntentCopy,
  type SeoIntentPage,
} from "@/lib/seo-intent-copy";

export async function SeoIntentSection({
  page,
}: Readonly<{ page: SeoIntentPage }>) {
  const locale = await getRequestLocale();
  const copy = getSeoIntentCopy(locale, page);
  const headingId = `seo-intent-${page}`;

  return (
    <section
      aria-labelledby={headingId}
      className="container mx-auto px-4 pb-8 md:pb-10"
    >
      <div className="rounded-[1.75rem] border border-border/60 bg-card/70 p-5 shadow-sm md:p-7">
        <div className="max-w-4xl space-y-3">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">
            {copy.kicker}
          </p>
          <h2
            id={headingId}
            className="text-balance text-2xl font-black tracking-tight text-foreground md:text-3xl"
          >
            {copy.heading}
          </h2>
          <p className="text-pretty text-sm font-medium leading-7 text-muted-foreground md:text-base">
            {copy.body}
          </p>
        </div>

        <nav
          aria-label={copy.relatedLabel}
          className="mt-5 flex flex-wrap gap-2.5"
        >
          {copy.links.map((link) => (
            <Link
              key={`${page}-${link.href}`}
              href={localizeHref(link.href, locale)}
              className="rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-bold text-primary transition hover:bg-primary/10 hover:underline hover:underline-offset-4"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
