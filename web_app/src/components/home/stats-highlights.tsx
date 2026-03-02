'use client';

import { useLanguage } from '@/contexts/language-context';

const STAT_VALUES = ['50', '200+', '31', '4'] as const;

const STAT_KEYS = [
  'home.hero.stat_questions',
  'home.hero.stat_signs',
  'home.hero.stat_lessons',
  'home.hero.stat_languages',
] as const;

export function StatsHighlights() {
  const { t } = useLanguage();

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-b from-muted/30 via-background to-background py-12 lg:py-16"
      aria-label={t('home.stats.title')}
    >
      <div className="pointer-events-none absolute -top-32 start-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="container mx-auto px-4">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 md:grid-cols-4 lg:gap-6">
          {STAT_KEYS.map((key, i) => (
            <div
              key={key}
              className="group relative overflow-hidden rounded-2xl border bg-card/80 px-5 py-5 text-center shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-muted/40 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="pointer-events-none absolute inset-0 ring-1 ring-border/60" />

              <p className="relative text-3xl font-extrabold tracking-tight text-primary lg:text-4xl">
                {STAT_VALUES[i]}
              </p>
              <p className="relative mt-1 text-sm font-medium text-muted-foreground">
                {t(key)}
              </p>

              <div className="pointer-events-none absolute -bottom-10 start-1/2 h-24 w-24 -translate-x-1/2 rounded-full bg-primary/10 blur-2xl opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}