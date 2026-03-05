'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, Lightbulb, AlertCircle, AlertTriangle, Info, PenLine, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/language-context';

// ─── Types ───────────────────────────────────────────────

interface ErrorPattern {
  pattern: string;
  patternKey: string;
  count: number;
  percentage: number;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  affectedCategories: string[];
  recommendation: string;
  recommendationKey: string;
  exampleQuestions: number[];
}

// ─── Constants (labels use translation keys) ─────────────

const SEVERITY_CONFIG = {
  HIGH: {
    bar:        'bg-destructive',
    text:       'text-destructive',
    bg:         'bg-destructive/[0.07]',
    border:     'border-destructive/30',
    badgeBg:    'bg-destructive/10 text-destructive border-destructive/20',
    labelKey:   'error_patterns.severity_critical',
  },
  MEDIUM: {
    bar:        'bg-primary',
    text:       'text-primary',
    bg:         'bg-primary/[0.07]',
    border:     'border-primary/30',
    badgeBg:    'bg-primary/10 text-primary border-primary/20',
    labelKey:   'error_patterns.severity_important',
  },
  LOW: {
    bar:        'bg-secondary/60',
    text:       'text-secondary',
    bg:         'bg-secondary/[0.05]',
    border:     'border-secondary/20',
    badgeBg:    'bg-secondary/10 text-secondary border-secondary/20',
    labelKey:   'error_patterns.severity_minor',
  },
} as const;

// ─── Severity icon helper ─────────────────────────────────

function SeverityIcon({ severity, className }: { severity: 'HIGH' | 'MEDIUM' | 'LOW'; className?: string }) {
  if (severity === 'HIGH')   return <AlertCircle   className={className} />;
  if (severity === 'MEDIUM') return <AlertTriangle className={className} />;
  return <Info className={className} />;
}

const MAX_VISIBLE_QUESTIONS = 5;

// ─── Component ───────────────────────────────────────────

export function ErrorPatternList({ patterns }: { patterns: ErrorPattern[] }) {
  const { t } = useLanguage();
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);

  const toggle = (key: string) =>
    setExpandedPattern(prev => (prev === key ? null : key));

  return (
    <div className="space-y-4">
      {patterns.map((pattern, index) => {
        const cfg        = SEVERITY_CONFIG[pattern.severity];
        const isExpanded = expandedPattern === pattern.pattern;
        const practiceHref = `/practice/${pattern.affectedCategories[0]
          ?.toLowerCase().replace(/\s+/g, '-') ?? 'traffic-signs'}`;

        return (
          <Card
            key={pattern.pattern}
            className={cn('rounded-2xl border-2 transition-all shadow-sm', cfg.border)}
          >
            {/* ── Header (clickable) ── */}
            <CardHeader
              className={cn('cursor-pointer py-6 px-6', cfg.bg)}
              onClick={() => toggle(pattern.pattern)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', cfg.badgeBg)}>
                      <SeverityIcon severity={pattern.severity} className="w-4 h-4" />
                    </div>
                    <Badge className={cn('border text-xs font-semibold', cfg.badgeBg)}>
                      {t(cfg.labelKey)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">#{index + 1}</span>
                  </div>
                  <CardTitle className="text-lg font-black">{t(pattern.patternKey)}</CardTitle>
                  <p className="text-sm font-medium text-muted-foreground">{pattern.description}</p>
                </div>

                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={cn('text-3xl font-black', cfg.text)}>{pattern.count}</span>
                  <span className="text-xs text-muted-foreground">{t('error_patterns.errors_label')}</span>
                  {isExpanded
                    ? <ChevronUp   className="w-4 h-4 text-muted-foreground mt-1" />
                    : <ChevronDown className="w-4 h-4 text-muted-foreground mt-1" />
                  }
                </div>
              </div>
            </CardHeader>

            {/* ── Content ── */}
            <CardContent className="px-6 py-5 space-y-4">

              {/* Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-foreground">{t('error_patterns.impact_label')}</span>
                  <span className={cn('font-bold', cfg.text)}>
                    {pattern.percentage.toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={pattern.percentage}
                  className={cn('h-2 [&>div]:', cfg.bar)}
                />
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="space-y-4 border-t border-border/50 pt-4">

                  {/* Affected categories */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
                      {t('error_patterns.affected_categories')}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {pattern.affectedCategories.map(cat => (
                        <Badge key={cat} variant="secondary" className="rounded-full text-xs">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-primary mb-2">
                      <Lightbulb className="w-4 h-4 flex-shrink-0" />
                      {t('error_patterns.recommendation_label')}
                    </h4>
                    <p className="text-sm text-foreground/80">{t(pattern.recommendationKey)}</p>
                  </div>

                  {/* Example questions */}
                  {pattern.exampleQuestions.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
                        {t('error_patterns.example_questions_label')} ({pattern.exampleQuestions.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {pattern.exampleQuestions.slice(0, MAX_VISIBLE_QUESTIONS).map(qId => (
                          <Badge key={qId} variant="outline" className="font-mono text-xs">
                            Q#{qId}
                          </Badge>
                        ))}
                        {pattern.exampleQuestions.length > MAX_VISIBLE_QUESTIONS && (
                          <Badge variant="outline" className="text-xs">
                            {t('error_patterns.more_questions').replace('{n}', String(pattern.exampleQuestions.length - MAX_VISIBLE_QUESTIONS))}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" className="rounded-xl gap-2 shadow-sm shadow-primary/20" asChild>
                      <Link href={practiceHref}>
                        <PenLine className="w-3.5 h-3.5" />
                        {t('error_patterns.practice_pattern')}
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-xl gap-2">
                      <BookOpen className="w-3.5 h-3.5" />
                      {t('error_patterns.study_material')}
                    </Button>
                  </div>
                </div>
              )}

              {/* Collapsed CTA */}
              {!isExpanded && (
                <Button
                  variant="outline"
                  size="sm"
                  className={cn('w-full gap-2 rounded-xl font-semibold border', cfg.border, cfg.text, 'hover:opacity-80 transition-opacity')}
                  onClick={() => toggle(pattern.pattern)}
                >
                  <ChevronDown className="w-4 h-4" />
                  {t('error_patterns.view_details')}
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
