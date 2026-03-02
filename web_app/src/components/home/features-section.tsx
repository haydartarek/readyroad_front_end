'use client';

import Link from 'next/link';
import {
  FilePlus2, Clock, BarChart2,
  Layers, BookOpen, Globe, ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';

interface FeatureItem {
  icon: React.ElementType;
  badge: string;
  title: string;
  description: string;
  isPrimary: boolean;
  href: string;
}

export function FeaturesSection() {
  const { t } = useLanguage();

  const features: FeatureItem[] = [
    {
      icon: FilePlus2,
      badge: t('home.features.badge_exam'),
      title: t('home.features.exam_title'),
      description: t('home.features.exam_desc'),
      isPrimary: false,
      href: '/exam',
    },
    {
      icon: Clock,
      badge: t('home.features.badge_practice'),
      title: t('home.features.practice_title'),
      description: t('home.features.practice_desc'),
      isPrimary: true,
      href: '/practice',
    },
    {
      icon: BarChart2,
      badge: t('home.features.badge_analytics'),
      title: t('home.features.analytics_title'),
      description: t('home.features.analytics_desc'),
      isPrimary: false,
      href: '/dashboard',
    },
    {
      icon: Layers,
      badge: t('home.features.badge_signs'),
      title: t('home.features.signs_title'),
      description: t('home.features.signs_desc'),
      isPrimary: false,
      href: '/traffic-signs',
    },
    {
      icon: BookOpen,
      badge: t('home.features.badge_lessons'),
      title: t('home.features.lessons_title'),
      description: t('home.features.lessons_desc'),
      isPrimary: false,
      href: '/lessons',
    },
    {
      icon: Globe,
      badge: t('home.features.badge_more'),
      title: t('home.features.multilingual_title'),
      description: t('home.features.multilingual_desc'),
      isPrimary: false,
      href: '/dashboard',
    },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/20 py-16 lg:py-24">
      <div className="pointer-events-none absolute -top-44 start-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="container relative mx-auto px-4">
        <div className="mb-12 text-center lg:mb-16">
          <h2 className="mb-4 text-balance text-3xl font-extrabold tracking-tight text-secondary md:text-4xl lg:text-5xl">
            {t('home.features.title')}
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t('home.features.subtitle')}
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-7">
          {features.map((feature) => {
            const Icon = feature.icon;

            const cardBase =
              'group relative overflow-hidden rounded-3xl border bg-card/80 shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md';

            const cardPrimary =
              'border-primary/20 ring-1 ring-primary/15 hover:ring-primary/25';

            const cardDefault =
              'border-border hover:border-primary/20';

            return (
              <Card
                key={feature.title}
                className={`${cardBase} ${feature.isPrimary ? cardPrimary : cardDefault}`}
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-muted/35 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                <div className="pointer-events-none absolute inset-0 ring-1 ring-border/60" />

                <div className="absolute end-4 top-4">
                  <Button
                    size="sm"
                    variant={feature.isPrimary ? 'default' : 'outline'}
                    className="h-8 gap-1 rounded-full text-xs font-medium shadow-sm transition-all hover:shadow-md"
                    asChild
                  >
                    <Link href={feature.href}>
                      <ExternalLink className="h-3 w-3" aria-hidden />
                      {feature.badge}
                    </Link>
                  </Button>
                </div>

                <CardHeader className="pb-3 pt-6">
                  <div
                    className={[
                      'mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border bg-background/60 shadow-sm',
                      'transition-transform duration-200 group-hover:scale-[1.03]',
                      feature.isPrimary ? 'border-primary/25 ring-1 ring-primary/15' : 'border-border/80',
                    ].join(' ')}
                  >
                    <Icon className="h-5 w-5 text-primary" aria-hidden />
                  </div>

                  <CardTitle className="text-lg font-extrabold tracking-tight text-secondary sm:text-xl">
                    {feature.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="pb-7">
                  <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {feature.description}
                  </p>
                </CardContent>

                {feature.isPrimary && (
                  <>
                    <div className="pointer-events-none absolute -bottom-12 -end-12 h-48 w-48 rounded-full bg-primary/12 blur-3xl" />
                    <div className="pointer-events-none absolute -top-10 -start-10 h-36 w-36 rounded-full bg-secondary/10 blur-3xl" />
                  </>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}