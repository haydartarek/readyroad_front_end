'use client';

import { useLanguage } from '@/contexts/language-context';
import { useHomeStats } from '@/hooks/use-home-stats';

export function StatsHighlights() {
  const { t, language } = useLanguage();
  const { stats, loading } = useHomeStats();
  const formatter = new Intl.NumberFormat(language);

  const statItems = [
    { key: 'home.hero.stat_questions', value: stats?.examQuestionCount },
    { key: 'home.hero.stat_signs', value: stats?.trafficSignsCount },
    { key: 'home.hero.stat_lessons', value: stats?.lessonsCount },
    { key: 'home.hero.stat_languages', value: stats?.supportedLanguagesCount },
  ];

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-b from-muted/30 via-background to-background py-12 lg:py-16"
      aria-label={t('home.stats.title')}
    >
      <div className="pointer-events-none absolute -top-32 start-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="container mx-auto px-4">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 md:grid-cols-4 lg:gap-6">
          {statItems.map(({ key, value }) => (
            <div
              key={key}
              className="group relative overflow-hidden rounded-2xl border bg-card/80 px-5 py-5 text-center shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-muted/40 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="pointer-events-none absolute inset-0 ring-1 ring-border/60" />

              <p className="relative text-3xl font-extrabold tracking-tight text-primary lg:text-4xl">
                {loading && value == null ? (
                  <span className="inline-block h-9 w-16 animate-pulse rounded bg-muted align-middle" />
                ) : value == null ? (
                  '—'
                ) : (
                  formatter.format(value)
                )}
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
