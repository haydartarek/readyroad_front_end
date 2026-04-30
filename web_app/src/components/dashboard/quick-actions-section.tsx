'use client';

import Link from 'next/link';
import { ClipboardList, Target, BarChart2, BookOpen, ArrowRight, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';

function getVariantClasses(variant: 'primary' | 'secondary' | 'muted') {
  switch (variant) {
    case 'primary':
      return 'bg-primary/5 hover:bg-primary/10 border-primary/20';
    case 'secondary':
      return 'bg-secondary/5 hover:bg-secondary/10 border-secondary/20';
    case 'muted':
      return 'bg-muted hover:bg-muted/80 border-border';
  }
}

export function QuickActionsSection() {
  const { t } = useLanguage();

  const ACTIONS = [
    {
      title:       t('dashboard.action_exam_title'),
      description: t('dashboard.action_exam_desc'),
      icon:        ClipboardList,
      href:        '/exam',
      variant:     'primary' as const,
    },
    {
      title:       t('dashboard.action_practice_title'),
      description: t('dashboard.action_practice_desc'),
      icon:        Target,
      href:        '/practice',
      variant:     'secondary' as const,
    },
    {
      title:       t('dashboard.action_error_patterns_title'),
      description: t('dashboard.action_error_patterns_desc'),
      icon:        BarChart2,
      href:        '/dashboard?section=error-patterns',
      variant:     'muted' as const,
    },
    {
      title:       t('dashboard.action_weak_areas_title'),
      description: t('dashboard.action_weak_areas_desc'),
      icon:        TrendingDown,
      href:        '/dashboard?section=weak-areas',
      variant:     'muted' as const,
    },
    {
      title:       t('dashboard.action_lessons_title'),
      description: t('dashboard.action_lessons_desc'),
      icon:        BookOpen,
      href:        '/lessons',
      variant:     'secondary' as const,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {ACTIONS.map(({ title, description, icon: Icon, href, variant }) => (
        <Link key={href} href={href} className="group h-full">
          <Card
            className={cn(
              'h-full rounded-2xl border-2 shadow-sm transition-all duration-200 hover:shadow-md',
              getVariantClasses(variant)
            )}
          >
            <CardContent className="flex h-full flex-col gap-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-background shadow-sm">
                  <Icon className="h-4.5 w-4.5 text-primary" />
                </div>

                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/80 text-muted-foreground transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/20 group-hover:text-primary">
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </div>
              </div>

              <div className="min-w-0 space-y-1">
                <h3 className="text-base font-extrabold leading-tight text-foreground">
                  {title}
                </h3>
                <p className="text-xs leading-5 text-muted-foreground">
                  {description}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
