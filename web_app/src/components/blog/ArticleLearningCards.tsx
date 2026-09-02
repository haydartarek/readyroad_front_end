import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { localizePathname } from "@/lib/i18n-routing";
import { translateMessage } from "@/lib/messages";
import type { SiteLocale } from "@/lib/site-copy";

const learningCards = [
  { href: "/traffic-signs", image: "/images/traffic-signs.png", label: "blog.cards.traffic_signs" },
  { href: "/practice", image: "/images/practice.png", label: "blog.cards.practice" },
  { href: "/exam", image: "/images/exam.png", label: "blog.cards.exam" },
] as const;

export default function ArticleLearningCards({ locale }: { locale: SiteLocale }) {
  return (
    <aside
      aria-label={translateMessage(locale, "blog.continue_learning")}
      data-testid="article-learning-cards"
      className="my-8 grid grid-cols-1 gap-4 text-foreground sm:grid-cols-3"
    >
      {learningCards.map((card) => (
        <Link
          key={card.href}
          href={localizePathname(card.href, locale)}
          className="group flex min-w-0 flex-col rounded-lg border border-border/60 bg-card shadow-sm transition-colors hover:border-primary/60 hover:bg-primary/[0.03] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
        >
          <Image
            src={card.image}
            alt=""
            width={1672}
            height={941}
            sizes="(max-width: 639px) calc(100vw - 48px), 240px"
            className="h-auto w-full rounded-t-lg"
          />
          <span className="flex flex-1 items-center justify-between gap-3 p-4 text-sm font-bold leading-6">
            <span className="min-w-0 break-words">{translateMessage(locale, card.label)}</span>
            <ArrowRight className="h-4 w-4 shrink-0 text-primary rtl:rotate-180" aria-hidden="true" />
          </span>
        </Link>
      ))}
    </aside>
  );
}
