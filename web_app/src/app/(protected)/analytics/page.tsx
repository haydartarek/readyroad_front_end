'use client';

import Link from 'next/link';
import { AlertCircle, TrendingUp, ChevronRight, BarChart2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import { ROUTES } from '@/lib/constants';

// ─── Analytics Hub ──────────────────────────────────────
// Entry point for /analytics — links to both sub-sections.
// Navbar links directly to weak-areas, but users may land here
// via breadcrumb or direct URL.
// ─────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { t } = useLanguage();

  const cards = [
    {
      href:        ROUTES.ANALYTICS_ERROR_PATTERNS,
      icon:        AlertCircle,
      iconBg:      'bg-destructive/10',
      iconColor:   'text-destructive',
      borderColor: 'border-destructive/20 hover:border-destructive/40',
      title:       t('analytics.error_patterns'),
      desc:        t('analytics.hub.error_patterns_desc'),
    },
    {
      href:        ROUTES.ANALYTICS_WEAK_AREAS,
      icon:        TrendingUp,
      iconBg:      'bg-primary/10',
      iconColor:   'text-primary',
      borderColor: 'border-primary/20 hover:border-primary/40',
      title:       t('analytics.weak_areas'),
      desc:        t('analytics.hub.weak_areas_desc'),
    },
  ] as const;

  return (
    <div className="space-y-6">

      {/* Header — matches site-wide gradient card pattern (dashboard, error-patterns, weak-areas) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/15 px-6 py-7 shadow-sm">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <BarChart2 className="w-6 h-6 text-primary" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-primary">{t('analytics.hub.badge')}</p>
            <h1 className="text-3xl font-black tracking-tight">{t('analytics.hub.title')}</h1>
            <p className="text-sm font-medium text-muted-foreground">{t('analytics.hub.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Feature cards — one per analytics sub-section */}
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map(({ href, icon: Icon, iconBg, iconColor, borderColor, title, desc }) => (
          <Card
            key={href}
            className={`rounded-2xl border-2 shadow-sm transition-all duration-150 hover:shadow-md ${borderColor}`}
          >
            <CardContent className="p-6 flex flex-col gap-4 h-full">
              <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
              </div>
              <div className="flex-1 space-y-1.5">
                <h2 className="text-xl font-black tracking-tight">{title}</h2>
                <p className="text-sm font-medium text-muted-foreground leading-relaxed">{desc}</p>
              </div>
              <Button asChild className="w-full gap-2 rounded-xl" variant="outline">
                <Link href={href}>
                  {t('analytics.hub.explore')}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );
}
