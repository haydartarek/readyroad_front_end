'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useLanguage } from '@/contexts/language-context';

export function FeaturesSection() {
  const { t } = useLanguage();

  const features = [
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="15" y2="15" />
        </svg>
      ),
      badge: t('home.features.badge_exam'),
      title: t('home.features.exam_title'),
      description: t('home.features.exam_desc'),
      isPrimary: false,
      href: '/exam',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      badge: t('home.features.badge_practice'),
      title: t('home.features.practice_title'),
      description: t('home.features.practice_desc'),
      isPrimary: true,
      href: '/practice',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
      badge: t('home.features.badge_analytics'),
      title: t('home.features.analytics_title'),
      description: t('home.features.analytics_desc'),
      isPrimary: false,
      href: '/dashboard',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      ),
      badge: t('home.features.badge_signs'),
      title: t('home.features.signs_title'),
      description: t('home.features.signs_desc'),
      isPrimary: false,
      href: '/traffic-signs',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      ),
      badge: t('home.features.badge_lessons'),
      title: t('home.features.lessons_title'),
      description: t('home.features.lessons_desc'),
      isPrimary: false,
      href: '/lessons',
    },
    {
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2v10l4.5 4.5" />
        </svg>
      ),
      badge: t('home.features.badge_more'),
      title: t('home.features.multilingual_title'),
      description: t('home.features.multilingual_desc'),
      isPrimary: false,
      href: '/dashboard',
    },
  ];

  return (
    <section className="relative overflow-hidden bg-background py-16 lg:py-24">
      <div className="container relative mx-auto px-4">
        {/* Section header */}
        <div className="mb-12 text-center lg:mb-16">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-secondary md:text-4xl lg:text-5xl">
            {t('home.features.title')}
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {t('home.features.subtitle')}
          </p>
        </div>

        {/* Feature cards grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className={`group relative overflow-hidden rounded-3xl border transition-all duration-300 hover:shadow-xl ${feature.isPrimary
                  ? 'border-primary/20 bg-primary/5 ring-2 ring-primary/10'
                  : 'border-border bg-card hover:border-primary/20'
                }`}
            >
              {/* Top badge button */}
              <div className="absolute end-4 top-4">
                <Link href={feature.href}>
                  <Button
                    size="sm"
                    variant={feature.isPrimary ? 'default' : 'outline'}
                    className="h-8 rounded-full text-xs font-medium shadow-sm transition-all"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="me-1">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    {feature.badge}
                  </Button>
                </Link>
              </div>

              <CardHeader className="pb-4">
                {/* Icon container */}
                <div
                  className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl text-primary shadow-sm transition-transform duration-300 group-hover:scale-105 ${feature.isPrimary
                      ? 'bg-primary/15 ring-1 ring-primary/15'
                      : 'bg-primary/[0.06]'
                    }`}
                >
                  {feature.icon}
                </div>

                <CardTitle className="text-xl font-bold text-secondary">
                  {feature.title}
                </CardTitle>
              </CardHeader>

              <CardContent>
                <p className="leading-relaxed text-muted-foreground">{feature.description}</p>
              </CardContent>

              {/* Decorative corner accent for primary card */}
              {feature.isPrimary && (
                <div className="pointer-events-none absolute -bottom-8 -end-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
