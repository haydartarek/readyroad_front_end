'use client';

import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

/**
 * Social-proof section — shows testimonials when available,
 * falls back to a "Beta feedback" callout if none exist.
 *
 * Currently uses static testimonials with first-name-only + optional city.
 * No personal data beyond that is ever shown.
 */
export function TestimonialsSection() {
    const { t } = useLanguage();
    const { isAuthenticated, isLoading } = useAuth();

    /* Toggle to false to show the beta-feedback fallback instead. */
    const hasTestimonials = true;

    const avatarColors = ['bg-primary', 'bg-secondary', 'bg-primary/80'];

    const testimonials = [
        {
            name: t('home.testimonials.t1_name'),
            city: t('home.testimonials.t1_city'),
            quote: t('home.testimonials.t1_quote'),
            rating: 5,
        },
        {
            name: t('home.testimonials.t2_name'),
            city: t('home.testimonials.t2_city'),
            quote: t('home.testimonials.t2_quote'),
            rating: 5,
        },
        {
            name: t('home.testimonials.t3_name'),
            city: t('home.testimonials.t3_city'),
            quote: t('home.testimonials.t3_quote'),
            rating: 4,
        },
    ];

    return (
        <section className="relative overflow-hidden bg-muted/50 py-16 lg:py-20">
            <div className="container mx-auto px-4">
                <div className="mb-10 text-center">
                    <h2 className="mb-3 text-2xl font-bold tracking-tight text-secondary md:text-3xl lg:text-4xl">
                        {t('home.testimonials.title')}
                    </h2>
                    <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                        {t('home.testimonials.subtitle')}
                    </p>
                </div>

                {hasTestimonials ? (
                    <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
                        {testimonials.map((item, i) => (
                            <figure
                                key={i}
                                className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                            >
                                {/* Avatar + name row */}
                                <div className="mb-4 flex items-center gap-3">
                                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-primary-foreground ${avatarColors[i % avatarColors.length]}`}>
                                        {item.name.charAt(0)}
                                    </div>
                                    <div>
                                        <strong className="font-semibold text-secondary">{item.name}</strong>
                                        {item.city && <p className="text-xs text-muted-foreground">{item.city}</p>}
                                    </div>
                                </div>

                                {/* Star rating */}
                                <div className="mb-3 flex gap-0.5" aria-label={`${item.rating} out of 5 stars`}>
                                    {Array.from({ length: 5 }).map((_, s) => (
                                        <svg
                                            key={s}
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill={s < item.rating ? 'currentColor' : 'none'}
                                            stroke={s < item.rating ? 'currentColor' : 'hsl(var(--border))'}
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            aria-hidden="true"
                                            className="text-primary"
                                        >
                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                        </svg>
                                    ))}
                                </div>

                                <blockquote className="mb-4 flex-1 text-sm leading-relaxed text-foreground/80">
                                    &ldquo;{item.quote}&rdquo;
                                </blockquote>
                            </figure>
                        ))}
                    </div>
                ) : (
                    /* Beta-feedback fallback */
                    <div className="mx-auto max-w-lg rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
                        <h3 className="mb-2 text-lg font-semibold text-secondary">
                            {t('home.testimonials.beta_title')}
                        </h3>
                        <p className="mb-4 text-sm text-muted-foreground">{t('home.testimonials.beta_desc')}</p>
                        <Link
                            href="mailto:feedback@readyroad.be"
                            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                            {t('home.testimonials.beta_cta')}
                        </Link>
                    </div>
                )}

                {/* CTA below testimonials */}
                <div className="mt-10 text-center">
                    {isLoading ? (
                        <div className="mx-auto h-12 w-56 animate-pulse rounded-full bg-muted" />
                    ) : isAuthenticated ? (
                        <Link href="/dashboard">
                            <Button size="lg" className="h-12 rounded-full px-8 text-base font-bold shadow-md transition-all hover:shadow-lg">
                                {t('home.hero.cta_auth_primary')}
                            </Button>
                        </Link>
                    ) : (
                        <Link href="/register">
                            <Button size="lg" className="h-12 rounded-full px-8 text-base font-bold shadow-md transition-all hover:shadow-lg">
                                {t('home.testimonials.cta_text')}
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        </section>
    );
}
