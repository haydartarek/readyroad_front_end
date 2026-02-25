'use client';

import { useLanguage } from '@/contexts/language-context';

export function StatsHighlights() {
    const { t } = useLanguage();

    const stats = [
        { value: '50', label: t('home.hero.stat_questions') },
        { value: '200+', label: t('home.hero.stat_signs') },
        { value: '31', label: t('home.hero.stat_lessons') },
        { value: '4', label: t('home.hero.stat_languages') },
    ];

    return (
        <section className="bg-muted py-12 lg:py-16" aria-label={t('home.stats.title')}>
            <div className="container mx-auto px-4">
                <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 md:grid-cols-4 lg:gap-8">
                    {stats.map((s) => (
                        <div
                            key={s.label}
                            className="rounded-2xl border border-border bg-card px-6 py-5 text-center transition-shadow hover:shadow-md"
                        >
                            <div className="text-3xl font-bold text-primary lg:text-4xl">{s.value}</div>
                            <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
