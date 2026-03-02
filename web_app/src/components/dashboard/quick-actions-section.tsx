'use client';

import Link from 'next/link';
import { ClipboardList, Target, BarChart2, ArrowRight } from 'lucide-react';
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
      title:       t('dashboard.action_analytics_title'),
      description: t('dashboard.action_analytics_desc'),
      icon:        BarChart2,
      href:        '/analytics/error-patterns',
      variant:     'muted' as const,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {ACTIONS.map(({ title, description, icon: Icon, href, variant }) => (
        <Link key={href} href={href} className="group">
          <Card
            className={cn(
              'rounded-2xl border-2 shadow-sm transition-all duration-200 hover:shadow-md',
              getVariantClasses(variant)
            )}
          >
            <CardContent className="flex items-start gap-4 p-6">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-background shadow-sm border border-border">
                <Icon className="h-5 w-5 text-primary" />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-extrabold text-foreground">
                  {title}
                </h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {description}
                </p>
              </div>

              <ArrowRight
                className="h-4 w-4 flex-shrink-0 self-center text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
                aria-hidden
              />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
